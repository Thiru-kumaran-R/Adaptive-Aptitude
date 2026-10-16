'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const healthService = require('./services/healthService');
const { getActiveRequestCount } = require('./middleware/metricsMiddleware');
const database = require('./config/database');
const createApp = require('./app');
const User = require('./models/userModel');
const AuthSession = require('./models/authSessionModel');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NORMAL_SHUTDOWN_DRAIN_TIMEOUT_MS = 10000;
const FATAL_SHUTDOWN_DRAIN_TIMEOUT_MS = 5000;
const REQUEST_DRAIN_POLL_INTERVAL_MS = 50;

let isShuttingDown = false;
let httpServer = null;
let processHandlersRegistered = false;

const normalizeFatalError = (err, type) => {
  const fallback = {
    errorType: type,
    sanitizedErrorName: 'NonErrorObject',
    message: 'Unhandled non-Error object',
    sanitizedStack: undefined
  };

  try {
    if (typeof err === 'string' || typeof err === 'number') {
      return {
        errorType: type,
        sanitizedErrorName: 'NonErrorPrimitive',
        message: logger.sanitizeString(String(err)),
        sanitizedStack: undefined
      };
    }

    let isError = false;

    try {
      isError = err instanceof Error;
    } catch (_instanceofErr) {
      return fallback;
    }

    if (!isError) {
      return fallback;
    }

    let sanitizedErrorName = 'Error';
    let message = 'Fatal error';
    let sanitizedStack;

    try {
      if (typeof err.name === 'string' && err.name.length > 0) {
        sanitizedErrorName = logger.sanitizeString(err.name);
      }
    } catch (_nameErr) {}

    try {
      if (typeof err.message === 'string' && err.message.length > 0) {
        message = logger.sanitizeString(err.message);
      }
    } catch (_messageErr) {}

    try {
      if (typeof err.stack === 'string' && err.stack.length > 0) {
        sanitizedStack = logger.sanitizeString(err.stack);
      }
    } catch (_stackErr) {}

    return {
      errorType: type,
      sanitizedErrorName,
      message,
      sanitizedStack
    };
  } catch (_normalizationErr) {
    return fallback;
  }
};

const coordinateShutdown = async ({ reason, exitCode = 0, drainTimeoutMs = NORMAL_SHUTDOWN_DRAIN_TIMEOUT_MS }) => {
  // 1. Atomically claim shutdown ownership to prevent duplicate/recursive execution
  if (isShuttingDown) {
    process.exit(exitCode !== 0 ? exitCode : 1);
    return;
  }
  isShuttingDown = true;

  try {
    metrics.incrementCounter('phase13_lifecycle_events_total', { event: 'SHUTDOWN' });
  } catch (_err) {}

  logger.info({
    event: 'PROCESS_SHUTDOWN_STARTED',
    component: 'server',
    message: `Process shutdown initiated: ${reason}`,
    exitCode
  });

  try {
    healthService.setLifecycleState('SHUTTING_DOWN');
  } catch (_err) {}

  // 2. Stop accepting new connections
  if (httpServer) {
    try {
      if (typeof httpServer.close === 'function') {
        httpServer.close((err) => {
          if (err) {
            logger.warn({
              event: 'SERVER_CLOSE_ERROR',
              component: 'server',
              message: `Error closing HTTP server: ${err.message}`
            });
          }
        });
      }
      logger.info({
        event: 'SERVER_CLOSED',
        component: 'server',
        message: 'HTTP server stopped accepting new connections'
      });
    } catch (serverCloseErr) {
      logger.warn({
        event: 'SERVER_CLOSE_FAILED',
        component: 'server',
        message: `Failed to close HTTP server cleanly: ${serverCloseErr.message}`
      });
    }
  }

  // 3. Drain in-flight requests
  const drainStart = Date.now();
  while (Date.now() - drainStart < drainTimeoutMs) {
    const activeRequests = getActiveRequestCount();
    if (activeRequests <= 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DRAIN_POLL_INTERVAL_MS));
  }

  const remainingRequests = getActiveRequestCount();
  if (remainingRequests > 0) {
    logger.warn({
      event: 'REQUEST_DRAIN_TIMEOUT',
      component: 'server',
      message: `Drain timeout reached with ${remainingRequests} active request(s) remaining`
    });
  }

  // 4. Close database connection
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await database.disconnectDB();
      logger.info({
        event: 'DATABASE_CLOSED',
        component: 'database',
        message: 'Database connection closed cleanly'
      });
    }
  } catch (dbCloseErr) {
    logger.warn({
      event: 'DATABASE_CLOSE_FAILED',
      component: 'database',
      message: `Failed to close database connection: ${dbCloseErr.message}`
    });
  }

  // 5. Final exit
  process.exit(exitCode);
};

const handleFatalError = (err, type) => {
  const normalized = normalizeFatalError(err, type);

  logger.error({
    event: 'FATAL_PROCESS_ERROR',
    component: 'server',
    message: `Fatal ${type}: ${normalized.message}`,
    errorType: normalized.errorType,
    sanitizedErrorName: normalized.sanitizedErrorName,
    sanitizedStack: normalized.sanitizedStack
  });

  coordinateShutdown({
    reason: type,
    exitCode: 1,
    drainTimeoutMs: FATAL_SHUTDOWN_DRAIN_TIMEOUT_MS
  });
};

const handleSigterm = () => {
  coordinateShutdown({ reason: 'SIGTERM', exitCode: 0, drainTimeoutMs: NORMAL_SHUTDOWN_DRAIN_TIMEOUT_MS });
};

const handleSigint = () => {
  coordinateShutdown({ reason: 'SIGINT', exitCode: 0, drainTimeoutMs: NORMAL_SHUTDOWN_DRAIN_TIMEOUT_MS });
};

const handleUncaughtException = (err) => {
  handleFatalError(err, 'UNCAUGHT_EXCEPTION');
};

const handleUnhandledRejection = (reason) => {
  handleFatalError(reason, 'UNHANDLED_REJECTION');
};

const registerProcessHandlers = () => {
  if (processHandlersRegistered) return;
  processHandlersRegistered = true;

  process.on('SIGTERM', handleSigterm);
  process.on('SIGINT', handleSigint);
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);
};

/**
 * Ensures baseline User indexes and performs deep semantic verification of
 * email_1_canonical_unique and AuthSession physical indexes before listener bind.
 */
const verifyAndEnsureStartupIndexes = async () => {
  // 1. Explicitly ensure userId_1 unique physical index
  await User.collection.createIndex(
    { userId: 1 },
    {
      unique: true,
      name: 'userId_1'
    }
  );

  // 2. Explicitly ensure status_1 physical index
  await User.collection.createIndex(
    { status: 1 },
    {
      name: 'status_1'
    }
  );

  // 3. Inspect physical User indexes
  const userIndexes = await User.collection.indexes();

  const userIdIndex = userIndexes.find(
    (idx) =>
      idx.name === 'userId_1' &&
      idx.key?.userId === 1 &&
      idx.unique === true
  );

  const statusIndex = userIndexes.find(
    (idx) =>
      idx.name === 'status_1' &&
      idx.key?.status === 1
  );

  const emailIndex = userIndexes.find(
    (idx) => idx.name === 'email_1_canonical_unique'
  );

  const canonicalEmailIndexValid =
    emailIndex &&
    emailIndex.key?.email === 1 &&
    emailIndex.unique === true &&
    emailIndex.partialFilterExpression &&
    emailIndex.partialFilterExpression.email?.$exists === true &&
    emailIndex.partialFilterExpression.email?.$type === 'string' &&
    emailIndex.partialFilterExpression.email?.$gt === '';

  if (!userIdIndex || !statusIndex || !canonicalEmailIndexValid) {
    throw new Error('User physical index verification failed');
  }

  // 4. Create and deeply verify all 7 required non-_id AuthSession physical indexes
  await AuthSession.createIndexes();

  const sessionIndexes = await AuthSession.collection.indexes();

  const tokenIdIdx = sessionIndexes.find(
    (idx) => idx.name === 'tokenId_1' && idx.key?.tokenId === 1 && idx.unique === true
  );

  const tokenHashIdx = sessionIndexes.find(
    (idx) => idx.name === 'tokenHash_1' && idx.key?.tokenHash === 1 && idx.unique === true
  );

  const userIdIdx = sessionIndexes.find(
    (idx) => idx.name === 'userId_1' && idx.key?.userId === 1 && !idx.partialFilterExpression
  );

  const sessionIdIdx = sessionIndexes.find(
    (idx) => idx.name === 'sessionId_1' && idx.key?.sessionId === 1 && !idx.partialFilterExpression
  );

  const expiresAtIdx = sessionIndexes.find(
    (idx) => idx.name === 'expiresAt_1' && idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
  );

  const compoundIdx = sessionIndexes.find(
    (idx) =>
      idx.name === 'userId_1_sessionId_1_status_1' &&
      idx.key?.userId === 1 &&
      idx.key?.sessionId === 1 &&
      idx.key?.status === 1
  );

  const activePartialIdx = sessionIndexes.find(
    (idx) =>
      idx.name === 'sessionId_active_unique' &&
      idx.key?.sessionId === 1 &&
      idx.unique === true &&
      idx.partialFilterExpression?.status === 'active'
  );

  if (
    !tokenIdIdx ||
    !tokenHashIdx ||
    !userIdIdx ||
    !sessionIdIdx ||
    !expiresAtIdx ||
    !compoundIdx ||
    !activePartialIdx
  ) {
    throw new Error('AuthSession physical index verification failed');
  }
};

const start = async () => {
  try {
    await database.connectDB();

    // Deep physical index verification before listener bind
    await verifyAndEnsureStartupIndexes();

    const app = createApp();

    httpServer = app.listen(PORT, () => {
      try {
        healthService.setLifecycleState('RUNNING');
      } catch (_err) {}
      try {
        metrics.incrementCounter('phase13_lifecycle_events_total', { event: 'STARTUP' });
      } catch (_err) {}
      logger.info({
        event: 'SERVER_STARTUP_COMPLETED',
        component: 'server',
        message: `Server started successfully on port ${PORT}`
      });
    });
  } catch (err) {
    logger.error({
      event: 'SERVER_STARTUP_FAILED',
      component: 'server',
      message: `Server startup failed: ${err.message}`,
      errorCode: err?.code || 'STARTUP_ERROR',
      sanitizedStack: err.stack ? logger.sanitizeString(err.stack) : undefined
    });
    process.exit(1);
  }
};

registerProcessHandlers();

if (require.main === module) {
  start();
}

module.exports = {
  start,
  verifyAndEnsureStartupIndexes,
  registerProcessHandlers,
  coordinateShutdown,
  handleFatalError,
  normalizeFatalError,
  handleSigterm,
  handleSigint,
  handleUncaughtException,
  handleUnhandledRejection,
  getHttpServer: () => httpServer,
  setHttpServer: (server) => { httpServer = server; },
  setIsShuttingDown: (val) => { isShuttingDown = val; },
  getIsShuttingDown: () => isShuttingDown,
  resetServerStateForTesting: () => {
    isShuttingDown = false;
    httpServer = null;
    processHandlersRegistered = false;
  }
};
