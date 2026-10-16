'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const requestContext = require('../../src/utils/requestContext');
const logger = require('../../src/utils/logger');
const metrics = require('../../src/utils/metrics');
const correlationMiddleware = require('../../src/middleware/correlationMiddleware');
const {
  determineNormalizedRoute,
  normalizeHttpMethod,
  normalizeStatusClass,
  resetRoutesForTesting
} = require('../../src/middleware/metricsMiddleware');
const errorHandler = require('../../src/middleware/errorHandler');
const { classifyOperationalError, selectOperationalLogLevel } = errorHandler;
const { normalizeFatalError } = require('../../src/server');

describe('Phase 13 Observability & Telemetry Verification', () => {
  beforeEach(() => {
    metrics.resetRegistryForTesting();
    resetRoutesForTesting();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Correlation Middleware & Context Propagation', () => {
    it('accepts valid X-Correlation-ID header, validates regex, and propagates value', () => {
      const req = { headers: { 'x-correlation-id': 'custom-cid-123_abc' }, method: 'GET' };
      const res = { setHeader: jest.fn() };
      let capturedStore;
      correlationMiddleware(req, res, () => {
        capturedStore = requestContext.getStore();
      });

      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'custom-cid-123_abc');
      expect(capturedStore).toEqual({
        correlationId: 'custom-cid-123_abc',
        method: 'GET',
        normalizedRoute: 'UNRESOLVED'
      });
    });

    it('falls back to X-Request-ID when X-Correlation-ID is absent', () => {
      const req = { headers: { 'x-request-id': 'req-id-789' }, method: 'POST' };
      const res = { setHeader: jest.fn() };
      let capturedStore;
      correlationMiddleware(req, res, () => {
        capturedStore = requestContext.getStore();
      });

      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'req-id-789');
      expect(capturedStore.correlationId).toBe('req-id-789');
    });

    it('generates fresh UUID v4 when headers are missing, oversized, or contain illegal characters', () => {
      const req = { headers: { 'x-correlation-id': 'illegal;chars!@#$'.repeat(10) }, method: 'GET' };
      const res = { setHeader: jest.fn() };
      let capturedStore;
      correlationMiddleware(req, res, () => {
        capturedStore = requestContext.getStore();
      });

      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.stringMatching(/^[a-z0-9-]{36}$/));
      expect(capturedStore.correlationId).toMatch(/^[a-z0-9-]{36}$/);
    });

    it('propagates context through asynchronous boundaries via AsyncLocalStorage', async () => {
      let asyncCaptured;
      await requestContext.run({ correlationId: 'async-cid', method: 'GET', normalizedRoute: 'test' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        asyncCaptured = requestContext.getStore();
      });

      expect(asyncCaptured.correlationId).toBe('async-cid');
      expect(requestContext.getStore()).toBeUndefined();
    });
  });

  describe('Structured Logger & Redaction Engine', () => {
    let stdoutSpy;
    let stderrSpy;

    beforeEach(() => {
      stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
      stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {});
    });

    it('protects canonical fields from caller override and includes standard fields', () => {
      logger.info({
        event: 'SERVER_STARTUP_COMPLETED',
        message: 'Startup test',
        level: 'OVERRIDE_LEVEL',
        timestamp: 'OVERRIDE_TIME'
      });

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(parsed.level).toBe('info');
      expect(parsed.event).toBe('SERVER_STARTUP_COMPLETED');
      expect(parsed.message).toBe('Startup test');
      expect(parsed.timestamp).not.toBe('OVERRIDE_TIME');
      expect(parsed.component).toBe('server');
    });

    it('drops unsupported optional fields per the event allowlist', () => {
      logger.info({
        event: 'SERVER_STARTUP_COMPLETED',
        message: 'Startup test',
        unsupportedField: 'FORBIDDEN_VALUE',
        durationMs: 123 // Not in SERVER_STARTUP_COMPLETED allowlist
      });

      const parsed = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(parsed.unsupportedField).toBeUndefined();
      expect(parsed.durationMs).toBeUndefined();
    });

    it('maps unknown event to LOG_EVENT', () => {
      logger.info({
        event: 'UNRECOGNIZED_EVENT_123',
        message: 'Test message'
      });

      const parsed = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(parsed.event).toBe('LOG_EVENT');
    });

    it('redacts sensitive keys including passwords, tokens, secrets, and answers', () => {
      const payload = {
        event: 'HTTP_REQUEST_COMPLETED',
        message: 'Done',
        data: {
          password: 'secretPassword',
          userToken: 'token123',
          answers: ['A', 'B'],
          selectedOptions: [1, 2]
        }
      };
      const redacted = logger.redact(payload);
      expect(redacted.data.password).toBe('[REDACTED]');
      expect(redacted.data.userToken).toBe('[REDACTED]');
      expect(redacted.data.answers).toBe('[REDACTED]');
      expect(redacted.data.selectedOptions).toBe('[REDACTED]');
    });

    it('sanitizes MongoDB URIs and Bearer tokens', () => {
      const str = 'Connected to mongodb://user:pass@localhost:27017/db with Bearer eyJhbGciOi...';
      const sanitized = logger.sanitizeString(str);
      expect(sanitized).toBe('Connected to mongodb://[REDACTED_URI] with Bearer [REDACTED]');
    });

    it('unconditionally sanitizes absolute /Users and /home filesystem paths including node_modules', () => {
      const macPath = 'Error at /Users/developer/project/node_modules/express/lib/router.js:42';
      const linuxPath = 'Error at /home/runner/work/node_modules/mongoose/index.js:10';
      const appRoute = '/api/v1/questions?topic=Algebra';

      expect(logger.sanitizeString(macPath)).toBe('Error at [PATH]');
      expect(logger.sanitizeString(linuxPath)).toBe('Error at [PATH]');
      expect(logger.sanitizeString(appRoute)).toBe('/api/v1/questions?topic=Algebra');
    });

    it('handles circular references and depth limits with sentinel tokens', () => {
      // Circular
      const circ = { name: 'cycle' };
      circ.self = circ;
      const redCirc = logger.redact(circ);
      expect(redCirc.self).toBe('[CIRCULAR]');

      // Depth limit > 8
      let deep = { level: 9 };
      for (let i = 8; i >= 0; i--) {
        deep = { child: deep };
      }
      const redDeep = logger.redact(deep);
      let cur = redDeep;
      while (cur && typeof cur.child === 'object') {
        cur = cur.child;
      }
      expect(cur.child).toBe('[REDACTED_DEPTH_LIMIT]');
    });

    it('emits exact static OBSERVABILITY_FAILSAFE_LINE without timestamp on write exception', () => {
      stdoutSpy.mockImplementation(() => {
        throw new Error('Disk write failure');
      });

      logger.info({ event: 'SERVER_STARTUP_COMPLETED', message: 'Fail test' });

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const failsafeLine = stderrSpy.mock.calls[0][0];
      expect(failsafeLine).toBe(
        '{"level":"error","event":"OBSERVABILITY_LOG_WRITE_FAILURE","component":"logger","message":"Structured log emission failed"}\n'
      );
      expect(failsafeLine).not.toContain('timestamp');
    });

    it('maps OBSERVABILITY_LOG_WRITE_FAILURE attempted by caller to LOG_EVENT in normal logger', () => {
      logger.error({
        event: 'OBSERVABILITY_LOG_WRITE_FAILURE',
        message: 'Illegal attempt'
      });

      const parsed = JSON.parse(stderrSpy.mock.calls[0][0]);
      expect(parsed.event).toBe('LOG_EVENT');
    });
  });

  describe('Fatal Error Normalization Safety Contract', () => {
    it('preserves sanitized name, message, stack for ordinary Error', () => {
      const err = new Error('Test fatal failure');
      const norm = normalizeFatalError(err, 'UNCAUGHT_EXCEPTION');
      expect(norm).toEqual({
        errorType: 'UNCAUGHT_EXCEPTION',
        sanitizedErrorName: 'Error',
        message: 'Test fatal failure',
        sanitizedStack: expect.any(String)
      });
    });

    it('returns NonErrorPrimitive for string and number rejection reasons', () => {
      const strNorm = normalizeFatalError('Promise rejected with raw string', 'UNHANDLED_REJECTION');
      expect(strNorm).toEqual({
        errorType: 'UNHANDLED_REJECTION',
        sanitizedErrorName: 'NonErrorPrimitive',
        message: 'Promise rejected with raw string',
        sanitizedStack: undefined
      });

      const numNorm = normalizeFatalError(500, 'UNHANDLED_REJECTION');
      expect(numNorm).toEqual({
        errorType: 'UNHANDLED_REJECTION',
        sanitizedErrorName: 'NonErrorPrimitive',
        message: '500',
        sanitizedStack: undefined
      });
    });

    it('returns safe fallback for plain object, null, undefined, Symbol, BigInt', () => {
      const objNorm = normalizeFatalError({ custom: 'object' }, 'UNCAUGHT_EXCEPTION');
      expect(objNorm).toEqual({
        errorType: 'UNCAUGHT_EXCEPTION',
        sanitizedErrorName: 'NonErrorObject',
        message: 'Unhandled non-Error object',
        sanitizedStack: undefined
      });

      const nullNorm = normalizeFatalError(null, 'UNCAUGHT_EXCEPTION');
      expect(nullNorm.sanitizedErrorName).toBe('NonErrorObject');

      const undefNorm = normalizeFatalError(undefined, 'UNCAUGHT_EXCEPTION');
      expect(undefNorm.sanitizedErrorName).toBe('NonErrorObject');

      const symNorm = normalizeFatalError(Symbol('sym'), 'UNCAUGHT_EXCEPTION');
      expect(symNorm.sanitizedErrorName).toBe('NonErrorObject');

      const bigNorm = normalizeFatalError(BigInt(9007199254740991), 'UNCAUGHT_EXCEPTION');
      expect(bigNorm.sanitizedErrorName).toBe('NonErrorObject');
    });

    it('proves hostile Proxy whose getPrototypeOf trap throws returns safe fallback without throwing', () => {
      const hostileProxy = new Proxy({}, {
        getPrototypeOf() {
          throw new Error('Hostile getPrototypeOf trap explosion');
        }
      });

      expect(() => {
        const norm = normalizeFatalError(hostileProxy, 'UNCAUGHT_EXCEPTION');
        expect(norm).toEqual({
          errorType: 'UNCAUGHT_EXCEPTION',
          sanitizedErrorName: 'NonErrorObject',
          message: 'Unhandled non-Error object',
          sanitizedStack: undefined
        });
      }).not.toThrow();
    });

    it('proves throwing message, name, and stack getters are isolated and return safe defaults without throwing', () => {
      const errWithMessageThrow = new Error('base');
      Object.defineProperty(errWithMessageThrow, 'message', {
        get() {
          throw new Error('Hostile message getter');
        }
      });
      const normMsg = normalizeFatalError(errWithMessageThrow, 'UNCAUGHT_EXCEPTION');
      expect(normMsg.message).toBe('Fatal error');

      const errWithNameThrow = new Error('base');
      Object.defineProperty(errWithNameThrow, 'name', {
        get() {
          throw new Error('Hostile name getter');
        }
      });
      const normName = normalizeFatalError(errWithNameThrow, 'UNCAUGHT_EXCEPTION');
      expect(normName.sanitizedErrorName).toBe('Error');

      const errWithStackThrow = new Error('base');
      Object.defineProperty(errWithStackThrow, 'stack', {
        get() {
          throw new Error('Hostile stack getter');
        }
      });
      const normStack = normalizeFatalError(errWithStackThrow, 'UNCAUGHT_EXCEPTION');
      expect(normStack.sanitizedStack).toBeUndefined();
    });
  });

  describe('Route, Method & Status-Class Normalization', () => {
    it('normalizes matched routes to templates', () => {
      const req = { baseUrl: '/api/v1/questions', route: { path: '/:id' } };
      expect(determineNormalizedRoute(req, {}, 200)).toBe('/api/v1/questions/:id');
    });

    it('normalizes 404 unmatched route to UNMATCHED', () => {
      expect(determineNormalizedRoute({}, {}, 404)).toBe('UNMATCHED');
    });

    it('normalizes pre-route failure to UNRESOLVED', () => {
      expect(determineNormalizedRoute({}, {}, 500)).toBe('UNRESOLVED');
    });

    it('caps dynamic application routes at 26 and collapses 27th+ to OTHER', () => {
      for (let i = 1; i <= 26; i++) {
        const req = { baseUrl: '/api/v1', route: { path: `/route_${i}` } };
        expect(determineNormalizedRoute(req, {}, 200)).toBe(`/api/v1/route_${i}`);
      }
      const overflowReq = { baseUrl: '/api/v1', route: { path: '/route_27' } };
      expect(determineNormalizedRoute(overflowReq, {}, 200)).toBe('OTHER');
    });

    it('preserves fixed operational routes without consuming dynamic budget', () => {
      expect(determineNormalizedRoute({ route: { path: '/health' } }, {}, 200)).toBe('/health');
      expect(determineNormalizedRoute({ route: { path: '/health/live' } }, {}, 200)).toBe('/health/live');
      expect(determineNormalizedRoute({ route: { path: '/health/ready' } }, {}, 200)).toBe('/health/ready');
      expect(determineNormalizedRoute({ route: { path: '/metrics' } }, {}, 200)).toBe('/metrics');
    });

    it('normalizes methods and status classes', () => {
      expect(normalizeHttpMethod('get')).toBe('GET');
      expect(normalizeHttpMethod('POST')).toBe('POST');
      expect(normalizeHttpMethod('PATCH')).toBe('PATCH');
      expect(normalizeHttpMethod('INVALID_METHOD')).toBe('OTHER');

      expect(normalizeStatusClass(200)).toBe('2xx');
      expect(normalizeStatusClass(301)).toBe('3xx');
      expect(normalizeStatusClass(404)).toBe('4xx');
      expect(normalizeStatusClass(500)).toBe('5xx');
      expect(normalizeStatusClass(100)).toBe('OTHER');
    });
  });

  describe('Centralized Error Handler & Public Error DTO', () => {
    it('preserves exact public error DTO in production and development environments with NO stack', () => {
      const envs = ['production', 'development', 'test'];
      for (const env of envs) {
        process.env.NODE_ENV = env;
        const err = new Error('Sensitive internal crash details');
        err.statusCode = 500;
        err.code = 'INTERNAL_SERVER_ERROR';

        const jsonMock = jest.fn();
        const statusMock = jest.fn(() => ({ json: jsonMock }));
        const res = { status: statusMock };

        errorHandler(err, {}, res, () => {});

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Sensitive internal crash details'
          }
        });
        expect(jsonMock.mock.calls[0][0].error.stack).toBeUndefined();
        expect(jsonMock.mock.calls[0][0].error.correlationId).toBeUndefined();
      }
    });

    it('classifies operational category and selects exact log severity without altering HTTP semantics', () => {
      expect(classifyOperationalError({ code: 'VALIDATION_ERROR', statusCode: 400 })).toBe('CLIENT_VALIDATION');
      expect(selectOperationalLogLevel({ code: 'VALIDATION_ERROR', statusCode: 400 })).toBe('warn');

      expect(classifyOperationalError({ code: 'POLICY_VERSION_ALREADY_EXISTS', statusCode: 409 })).toBe('GOVERNANCE_CONFLICT');
      expect(selectOperationalLogLevel({ code: 'POLICY_VERSION_ALREADY_EXISTS', statusCode: 409 })).toBe('warn');

      expect(classifyOperationalError({ code: 'ROUTE_NOT_FOUND', statusCode: 404 })).toBe('CLIENT_NOT_FOUND');
      expect(selectOperationalLogLevel({ code: 'ROUTE_NOT_FOUND', statusCode: 404 })).toBe('info');

      expect(classifyOperationalError({ code: 'INTERNAL_SERVER_ERROR', statusCode: 500 })).toBe('INFRASTRUCTURE_FAULT');
      expect(selectOperationalLogLevel({ code: 'INTERNAL_SERVER_ERROR', statusCode: 500 })).toBe('error');
    });

    it('proves legacy ValidationError is preserved as HTTP 400, VALIDATION_ERROR, and logged at warn severity', () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      const valErr = new Error('Goal validation failed: type: invalid type');
      valErr.name = 'ValidationError';
      valErr.errors = {
        type: { message: 'type must be one of: company, government, entrance' }
      };

      const jsonMock = jest.fn();
      const statusMock = jest.fn(() => ({ json: jsonMock }));
      const res = { status: statusMock };

      errorHandler(valErr, { method: 'POST', baseUrl: '/api/v1/goals' }, res, () => {});

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type must be one of: company, government, entrance'
        }
      });
      expect(jsonMock.mock.calls[0][0].error.stack).toBeUndefined();
      expect(jsonMock.mock.calls[0][0].error.correlationId).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.objectContaining({
        event: 'HTTP_REQUEST_ERROR',
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        operationalCategory: 'CLIENT_VALIDATION'
      }));
    });

    it('proves legacy duplicate key 11000 is preserved as HTTP 409, DUPLICATE_KEY without altering public DTO', () => {
      const dupErr = new Error('E11000 duplicate key error collection');
      dupErr.code = 11000;

      const jsonMock = jest.fn();
      const statusMock = jest.fn(() => ({ json: jsonMock }));
      const res = { status: statusMock };

      errorHandler(dupErr, { method: 'POST', baseUrl: '/api/v1/users' }, res, () => {});

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: 'A record with the provided unique fields already exists.'
        }
      });
      expect(jsonMock.mock.calls[0][0].error.stack).toBeUndefined();
      expect(jsonMock.mock.calls[0][0].error.correlationId).toBeUndefined();
    });
  });

  describe('Metrics Registry Contracts & Prometheus Exposition', () => {
    it('records counters, gauges, histograms and exports valid Prometheus 0.0.4 text', () => {
      metrics.incrementCounter('http_requests_total', { method: 'GET', route: '/health', statusClass: '2xx' });
      metrics.recordHistogram('http_request_duration_ms', { method: 'GET', route: '/health' }, 12);
      metrics.setGauge('http_active_requests', {}, 3);

      const promText = metrics.toPrometheusText();
      expect(promText).toContain('# TYPE http_requests_total counter');
      expect(promText).toContain('http_requests_total{method="GET",route="/health",statusClass="2xx"} 1');
      expect(promText).toContain('# TYPE http_request_duration_ms histogram');
      expect(promText).toContain('http_request_duration_ms_bucket{method="GET",route="/health",le="25"} 1');
      expect(promText).toContain('http_active_requests 3');
      expect(promText).toContain('process_uptime_seconds');
    });

    it('enforces counter series cap of 500 and routes overflow to preallocated series', () => {
      for (let i = 0; i < 600; i++) {
        metrics.incrementCounter('http_requests_total', { method: 'GET', route: `/route_${i}`, statusClass: '2xx' });
      }

      const json = metrics.getMetricsJSON();
      const series = json.counters['http_requests_total'];
      expect(series.length).toBeLessThanOrEqual(500);

      // Verify overflow series captured entries
      const overflow = series.find((s) => s.labels.route === 'OTHER' && s.labels.statusClass === 'OTHER');
      expect(overflow).toBeDefined();
      expect(overflow.value).toBeGreaterThan(0);
    });

    it('toPrometheusText() is guaranteed non-throwing and returns empty string on failure', () => {
      jest.spyOn(Array.prototype, 'join').mockImplementationOnce(() => {
        throw new Error('Serialization fault');
      });

      expect(metrics.toPrometheusText()).toBe('');
    });

    it('getMetricsJSON() is guaranteed non-throwing and returns safe fallback on failure', () => {
      jest.spyOn(Map.prototype, 'values').mockImplementationOnce(() => {
        throw new Error('Registry fault');
      });

      const fallback = metrics.getMetricsJSON();
      expect(fallback).toEqual({
        uptimeSeconds: expect.any(Number),
        counters: {},
        gauges: {},
        histograms: {}
      });
    });

    it('conditionally mounts /metrics route based on METRICS_ENABLED', async () => {
      // 1. Disabled (default)
      delete process.env.METRICS_ENABLED;
      let appInstance = createApp();
      let res = await request(appInstance).get('/metrics');
      expect(res.status).toBe(404);

      // 2. Enabled
      process.env.METRICS_ENABLED = 'true';
      appInstance = createApp();
      res = await request(appInstance).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain; version=0.0.4; charset=utf-8');
      expect(res.text).toContain('process_uptime_seconds');
      delete process.env.METRICS_ENABLED;
    });
  });
});
