const { performance } = require('node:perf_hooks');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const READINESS_PING_TIMEOUT_MS = 2000;

let lifecycleState = 'STARTING';

/**
 * Returns the current lifecycle state string.
 * @returns {'STARTING'|'RUNNING'|'SHUTTING_DOWN'}
 */
const getLifecycleState = () => lifecycleState;

/**
 * Transitions the lifecycle state with strict deterministic state validation.
 * @param {'STARTING'|'RUNNING'|'SHUTTING_DOWN'} nextState
 * @returns {'STARTING'|'RUNNING'|'SHUTTING_DOWN'}
 */
const setLifecycleState = (nextState) => {
  const VALID_STATES = ['STARTING', 'RUNNING', 'SHUTTING_DOWN'];
  if (!VALID_STATES.includes(nextState)) {
    throw new Error(`INVALID_LIFECYCLE_STATE: State "${nextState}" is not recognized.`);
  }

  // Idempotent assignment: same state -> no-op
  if (lifecycleState === nextState) {
    return lifecycleState;
  }

  // Enforce permitted transition rules
  if (lifecycleState === 'STARTING' && (nextState === 'RUNNING' || nextState === 'SHUTTING_DOWN')) {
    lifecycleState = nextState;
    return lifecycleState;
  }

  if (lifecycleState === 'RUNNING' && nextState === 'SHUTTING_DOWN') {
    lifecycleState = nextState;
    return lifecycleState;
  }

  throw new Error(
    `INVALID_LIFECYCLE_TRANSITION: Cannot transition lifecycle from "${lifecycleState}" to "${nextState}".`
  );
};

/**
 * Executes a dual-deadline ping command against the MongoDB admin database.
 * @param {number} [timeoutMs=2000]
 * @returns {Promise<boolean>}
 */
const pingDatabase = async (timeoutMs = READINESS_PING_TIMEOUT_MS) => {
  const pingStart = performance.now();
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const err = new Error(`MongoDB ping exceeded deadline of ${timeoutMs}ms`);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, timeoutMs);
    if (timerId.unref) timerId.unref();
  });

  const pingPromise = (async () => {
    if (!mongoose.connection?.db) {
      throw new Error('MongoDB connection is not established');
    }
    const adminDb = mongoose.connection.db.admin();
    return adminDb.ping({ maxTimeMS: timeoutMs });
  })();

  try {
    await Promise.race([pingPromise, timeoutPromise]);
    clearTimeout(timerId);
    const elapsedMs = performance.now() - pingStart;
    try {
      metrics.setGauge('mongodb_ping_duration_ms', {}, elapsedMs);
    } catch (_err) {}
    return true;
  } catch (err) {
    clearTimeout(timerId);
    pingPromise.catch(() => {}); // Safely swallow late rejections
    const elapsedMs = performance.now() - pingStart;
    try {
      metrics.setGauge('mongodb_ping_duration_ms', {}, elapsedMs);
    } catch (_err) {}

    // Emit MONGODB_PING_TIMEOUT specifically on ping deadline timeout
    if (err.code === 'ETIMEDOUT' || err.message?.includes('deadline') || err.message?.includes('maxTimeMS')) {
      try {
        logger.warn({
          event: 'MONGODB_PING_TIMEOUT',
          component: 'health',
          message: 'MongoDB readiness ping timed out',
          elapsedMs
        });
      } catch (_logErr) {}
    }

    throw err;
  }
};

/**
 * Evaluates process liveness.
 * @returns {{ status: 'LIVE', timestamp: string }}
 */
const evaluateLiveness = () => {
  try {
    metrics.setGauge('health_probe_status', { probe: 'live' }, 1);
  } catch (_err) {}
  return {
    status: 'LIVE',
    timestamp: new Date().toISOString()
  };
};

/**
 * Evaluates dynamic readiness including database reachability and lifecycle state.
 * @returns {Promise<{ statusCode: number, body: Object }>}
 */
const evaluateReadiness = async () => {
  try {
    const currentState = healthService.getLifecycleState();
    if (currentState !== 'RUNNING') {
      try {
        metrics.setGauge('health_probe_status', { probe: 'ready' }, 0);
      } catch (_err) {}
      return {
        statusCode: 503,
        body: {
          status: 'NOT_READY',
          state: currentState,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        metrics.setGauge('health_probe_status', { probe: 'ready' }, 0);
      } catch (_err) {}
      return {
        statusCode: 503,
        body: {
          status: 'NOT_READY',
          components: { database: 'DOWN' },
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      await healthService.pingDatabase(READINESS_PING_TIMEOUT_MS);
      try {
        metrics.setGauge('health_probe_status', { probe: 'ready' }, 1);
      } catch (_err) {}
      return {
        statusCode: 200,
        body: {
          status: 'READY',
          components: { database: 'UP' },
          timestamp: new Date().toISOString()
        }
      };
    } catch (_pingErr) {
      try {
        metrics.setGauge('health_probe_status', { probe: 'ready' }, 0);
      } catch (_err) {}
      return {
        statusCode: 503,
        body: {
          status: 'NOT_READY',
          components: { database: 'DOWN' },
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (_unexpectedErr) {
    // Top-level failure protection: does not throw through HTTP route
    try {
      metrics.setGauge('health_probe_status', { probe: 'ready' }, 0);
    } catch (_err) {}
    try {
      logger.error({
        event: 'HEALTH_CHECK_FAILED',
        component: 'health',
        message: 'Readiness evaluation failed',
        errorCode: 'HEALTH_CHECK_INTERNAL_FAILURE',
        operationalCategory: 'OBSERVABILITY_FAULT'
      });
    } catch (_logErr) {}
    return {
      statusCode: 503,
      body: {
        status: 'NOT_READY',
        components: { database: 'DOWN' },
        timestamp: new Date().toISOString()
      }
    };
  }
};

const resetLifecycleStateForTesting = (state = 'STARTING') => {
  lifecycleState = state;
};

const healthService = {
  getLifecycleState,
  setLifecycleState,
  pingDatabase,
  evaluateLiveness,
  evaluateReadiness,
  resetLifecycleStateForTesting
};

module.exports = healthService;

