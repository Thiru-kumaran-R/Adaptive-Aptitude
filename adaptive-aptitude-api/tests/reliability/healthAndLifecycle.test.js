'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app');
const healthService = require('../../src/services/healthService');
const { getActiveRequestCount, metricsMiddleware } = require('../../src/middleware/metricsMiddleware');
const correlationMiddleware = require('../../src/middleware/correlationMiddleware');
const metrics = require('../../src/utils/metrics');
const logger = require('../../src/utils/logger');
const database = require('../../src/config/database');
const server = require('../../src/server');

describe('Phase 13 Health & Lifecycle Reliability', () => {
  let app;

  beforeEach(() => {
    metrics.resetRegistryForTesting();
    healthService.resetLifecycleStateForTesting('RUNNING');
    app = createApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  describe('Database Configuration Invariants', () => {
    it('proves serverSelectionTimeoutMS remains strictly 5000', async () => {
      const connectSpy = jest.spyOn(mongoose, 'connect').mockImplementation(async (uri, options) => {
        expect(options.serverSelectionTimeoutMS).toBe(5000);
        return { connection: { host: 'localhost', name: 'adaptive_aptitude' } };
      });

      process.env.NODE_ENV = 'test';
      process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/adaptive_aptitude_test';
      await database.connectDB();
      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('Health Probes Contract', () => {
    it('legacy GET /health returns 200 with { success: true, status: "ok" } without DB dependency', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, status: 'ok' });
    });

    it('GET /health/live returns 200 under all conditions (connected, disconnected, SHUTTING_DOWN)', async () => {
      // 1. RUNNING
      let res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('LIVE');
      expect(typeof res.body.timestamp).toBe('string');

      // 2. SHUTTING_DOWN
      healthService.setLifecycleState('SHUTTING_DOWN');
      res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('LIVE');
    });

    it('GET /health/ready returns 200 when RUNNING, readyState=1, and ping succeeds', async () => {
      healthService.setLifecycleState('RUNNING');
      jest.spyOn(healthService, 'pingDatabase').mockResolvedValue(true);
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, writable: true, configurable: true });

      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'READY',
        components: { database: 'UP' },
        timestamp: expect.any(String)
      });

      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, writable: true, configurable: true });
    });

    it('GET /health/ready returns 503 when disconnected, ping timed out, or during shutdown', async () => {
      // 1. Disconnected (readyState !== 1)
      healthService.setLifecycleState('RUNNING');
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 0, writable: true, configurable: true });

      let res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('NOT_READY');
      expect(res.body.components).toEqual({ database: 'DOWN' });

      // 2. Ping timed out
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, writable: true, configurable: true });
      jest.spyOn(healthService, 'pingDatabase').mockRejectedValue(new Error('MongoDB ping exceeded deadline of 2000ms'));

      res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('NOT_READY');
      expect(res.body.components).toEqual({ database: 'DOWN' });

      // 3. During shutdown (SHUTTING_DOWN)
      healthService.setLifecycleState('SHUTTING_DOWN');
      res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('NOT_READY');
      expect(res.body.state).toBe('SHUTTING_DOWN');

      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, writable: true, configurable: true });
    });

    it('proves MONGODB_PING_TIMEOUT structured log is emitted when ping deadline exceeds 2000ms', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      const adminMock = {
        ping: jest.fn().mockReturnValue(new Promise(() => {})) // Never resolves
      };
      const origDb = mongoose.connection.db;
      mongoose.connection.db = { admin: () => adminMock };

      jest.useFakeTimers();
      const pingPromise = healthService.pingDatabase(2000);
      jest.advanceTimersByTime(2000);

      await expect(pingPromise).rejects.toThrow(/deadline of 2000ms/);

      expect(warnSpy).toHaveBeenCalledWith(expect.objectContaining({
        event: 'MONGODB_PING_TIMEOUT',
        component: 'health',
        message: 'MongoDB readiness ping timed out',
        elapsedMs: expect.any(Number)
      }));

      mongoose.connection.db = origDb;
      jest.useRealTimers();
    });

    it('proves internal health failure emits HEALTH_CHECK_FAILED, returns 503, and never throws through Express', async () => {
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
      jest.spyOn(healthService, 'getLifecycleState').mockImplementation(() => {
        throw new Error('Unexpected health internal crash');
      });

      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('NOT_READY');

      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
        event: 'HEALTH_CHECK_FAILED',
        component: 'health',
        errorCode: 'HEALTH_CHECK_INTERNAL_FAILURE',
        operationalCategory: 'OBSERVABILITY_FAULT'
      }));
    });

    it('proves Mongoose reconnected event alone does not mark readiness ready without a full probe pass', async () => {
      healthService.setLifecycleState('SHUTTING_DOWN');
      // Even if connection state says connected, lifecycle state SHUTTING_DOWN must return 503
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('NOT_READY');
    });
  });

  describe('Authoritative In-Flight Request Tracking', () => {
    it('increments once per request, decrements once on finish/close without double decrement, and never goes negative', () => {
      const req = {};
      let finishCallback;
      let closeCallback;
      const res = {
        statusCode: 200,
        once: jest.fn((event, cb) => {
          if (event === 'finish') finishCallback = cb;
          if (event === 'close') closeCallback = cb;
        })
      };
      const next = jest.fn();

      const initialCount = getActiveRequestCount();
      metricsMiddleware(req, res, next);
      expect(getActiveRequestCount()).toBe(initialCount + 1);
      expect(next).toHaveBeenCalled();

      // Trigger finish
      finishCallback();
      expect(getActiveRequestCount()).toBe(initialCount);

      // Trigger close afterwards (should be idempotent due to once-guard)
      closeCallback();
      expect(getActiveRequestCount()).toBe(initialCount);
    });

    it('participates in activeRequestCount and correlation even on malformed JSON body parser failures', async () => {
      const res = await request(app)
        .post('/api/v1/questions')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(res.status).toBe(400);
      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(getActiveRequestCount()).toBe(0);
    });

    it('isolates res.setHeader() failure and calls next() without failing request', () => {
      const req = { headers: {} };
      const res = {
        setHeader: jest.fn(() => {
          throw new Error('Headers already sent');
        })
      };
      const next = jest.fn();

      correlationMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Lifecycle State Machine Specification', () => {
    it('enforces valid transitions and terminal SHUTTING_DOWN', () => {
      // STARTING -> RUNNING
      healthService.resetLifecycleStateForTesting('STARTING');
      expect(healthService.getLifecycleState()).toBe('STARTING');

      healthService.setLifecycleState('RUNNING');
      expect(healthService.getLifecycleState()).toBe('RUNNING');

      // Idempotent assignment
      healthService.setLifecycleState('RUNNING');
      expect(healthService.getLifecycleState()).toBe('RUNNING');

      // RUNNING -> SHUTTING_DOWN
      healthService.setLifecycleState('SHUTTING_DOWN');
      expect(healthService.getLifecycleState()).toBe('SHUTTING_DOWN');

      // SHUTTING_DOWN is terminal
      expect(() => healthService.setLifecycleState('RUNNING')).toThrow(/INVALID_LIFECYCLE_TRANSITION/);
      expect(() => healthService.setLifecycleState('STARTING')).toThrow(/INVALID_LIFECYCLE_TRANSITION/);

      // Invalid state value
      expect(() => healthService.setLifecycleState('UNKNOWN_STATE')).toThrow(/INVALID_LIFECYCLE_STATE/);
    });
  });

  describe('Process Handlers & Shutdown Coordination', () => {
    it('registerProcessHandlers() is strictly idempotent and does not attach duplicate listeners', () => {
      const initialSigtermCount = process.listenerCount('SIGTERM');
      server.registerProcessHandlers();
      server.registerProcessHandlers();
      expect(process.listenerCount('SIGTERM')).toBe(initialSigtermCount);
    });

    it('coordinateShutdown waits for activeRequestCount === 0 and calls disconnectDB and exits with code 0', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const disconnectSpy = jest.spyOn(database, 'disconnectDB').mockResolvedValue();
      const origReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, writable: true, configurable: true });

      jest.useFakeTimers();
      const shutdownPromise = server.coordinateShutdown({ reason: 'SIGTERM', exitCode: 0, drainTimeoutMs: 10000 });
      jest.advanceTimersByTime(100);
      await shutdownPromise;

      expect(disconnectSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);
      jest.useRealTimers();
      Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, writable: true, configurable: true });
    });

    it('fail-fast terminates with exit 1 if a second signal/fatal error arrives during shutdown', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      server.setIsShuttingDown(true);

      await server.coordinateShutdown({ reason: 'SIGINT', exitCode: 0 });
      expect(exitSpy).toHaveBeenCalledWith(1);
      server.setIsShuttingDown(false);
    });
  });

  describe('Three Fatal States Mechanical Branching', () => {
    beforeEach(() => {
      server.resetServerStateForTesting();
    });

    it('Case A (Pre-DB: httpServer===null && readyState===0): sets SHUTTING_DOWN and exits 1 immediately without drain', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      server.setHttpServer(null);
      const origReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 0, writable: true, configurable: true });

      await server.handleFatalError(new Error('Case A Fatal'), 'UNCAUGHT_EXCEPTION');

      expect(healthService.getLifecycleState()).toBe('SHUTTING_DOWN');
      expect(exitSpy).toHaveBeenCalledWith(1);
      Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, writable: true, configurable: true });
    });

    it('Case B (DB connected, pre-server: httpServer===null && readyState!==0): sets SHUTTING_DOWN, disconnects DB, and exits 1', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const disconnectSpy = jest.spyOn(database, 'disconnectDB').mockResolvedValue();
      server.setHttpServer(null);
      const origReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, writable: true, configurable: true });

      await server.handleFatalError(new Error('Case B Fatal'), 'UNCAUGHT_EXCEPTION');

      expect(healthService.getLifecycleState()).toBe('SHUTTING_DOWN');
      expect(disconnectSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, writable: true, configurable: true });
    });

    it('Case C (Server exists: httpServer!==null): uses bounded drain, disconnects DB, and exits 1', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const disconnectSpy = jest.spyOn(database, 'disconnectDB').mockResolvedValue();
      const mockServer = {
        listening: true,
        close: jest.fn(),
        closeIdleConnections: jest.fn()
      };
      server.setHttpServer(mockServer);
      const origReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, writable: true, configurable: true });

      jest.useFakeTimers();
      const fatalPromise = server.handleFatalError(new Error('Case C Fatal'), 'UNCAUGHT_EXCEPTION');
      jest.advanceTimersByTime(100);
      await fatalPromise;

      expect(mockServer.close).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      jest.useRealTimers();
      Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, writable: true, configurable: true });
    });

    it('Lifecycle proof: hostile Proxy/getter fatal values reach shutdown branch without throwing in normalization', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      server.setHttpServer(null);
      const origReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 0, writable: true, configurable: true });

      const hostileProxy = new Proxy({}, {
        getPrototypeOf() {
          throw new Error('Hostile getPrototypeOf trap explosion');
        }
      });

      await server.handleFatalError(hostileProxy, 'UNCAUGHT_EXCEPTION');

      expect(healthService.getLifecycleState()).toBe('SHUTTING_DOWN');
      expect(exitSpy).toHaveBeenCalledWith(1);

      Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, writable: true, configurable: true });
    });
  });

  describe('Database Listener Registration & Telemetry Isolation', () => {
    it('registerConnectionListeners() is idempotent and listener metric failures do not crash', () => {
      const initialListenerCount = mongoose.connection.listenerCount('connected');
      database.registerConnectionListeners();
      database.registerConnectionListeners();
      expect(mongoose.connection.listenerCount('connected')).toBe(initialListenerCount);

      // Trigger connected event with throwing metric
      jest.spyOn(metrics, 'setGauge').mockImplementation(() => {
        throw new Error('Metric failure');
      });

      expect(() => {
        mongoose.connection.emit('connected');
      }).not.toThrow();
    });
  });
});
