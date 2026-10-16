const requestContext = require('./requestContext');

const OBSERVABILITY_FAILSAFE_LINE =
  '{"level":"error","event":"OBSERVABILITY_LOG_WRITE_FAILURE","component":"logger","message":"Structured log emission failed"}\n';

const PHASE13_LOG_EVENTS = new Set([
  'SERVER_STARTUP_COMPLETED',
  'SERVER_STARTUP_FAILED',
  'PROCESS_SHUTDOWN_STARTED',
  'PROCESS_SHUTDOWN_COMPLETED',
  'UNCAUGHT_EXCEPTION',
  'UNHANDLED_REJECTION',
  'MONGODB_CONNECTED',
  'MONGODB_DISCONNECTED',
  'MONGODB_RECONNECTED',
  'MONGODB_ERROR',
  'MONGODB_PING_TIMEOUT',
  'HTTP_REQUEST_COMPLETED',
  'HTTP_REQUEST_ERROR',
  'HEALTH_CHECK_FAILED'
]);

const PHASE14_LOG_EVENTS = new Set([
  'AUTH_REGISTER_SUCCESS',
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGOUT',
  'AUTH_TOKEN_REFRESH_SUCCESS',
  'AUTH_REFRESH_REUSE_DETECTED',
  'AUTH_SESSION_REVOKED',
  'AUTH_ACCESS_DENIED',
  'AUTH_ACCOUNT_DISABLED',
  'AUTH_RATE_LIMITED'
]);

const PHASE12_PRESERVED_EVENTS = new Set([
  'POLICY_REGISTRY_UNSEEDED_FALLBACK',
  'POLICY_REGISTRY_QUERY_FAILURE_FALLBACK',
  'GOVERNANCE_SECRET_NOT_CONFIGURED'
]);

const PHASE14_OPTIONAL_FIELDS = ['statusCode', 'errorCode', 'operationalCategory', 'reason', 'action'];

const EVENT_OPTIONAL_FIELDS = {
  HTTP_REQUEST_COMPLETED: ['statusCode', 'durationMs'],
  HTTP_REQUEST_ERROR: ['statusCode', 'errorCode', 'operationalCategory', 'sanitizedStack'],
  MONGODB_ERROR: ['errorCode'],
  MONGODB_PING_TIMEOUT: ['elapsedMs'],
  PROCESS_SHUTDOWN_STARTED: ['reason', 'exitCode', 'drainTimeoutMs'],
  PROCESS_SHUTDOWN_COMPLETED: ['reason', 'exitCode', 'elapsedMs'],
  UNCAUGHT_EXCEPTION: ['operationalCategory', 'errorType', 'sanitizedErrorName', 'sanitizedStack'],
  UNHANDLED_REJECTION: ['operationalCategory', 'errorType', 'sanitizedErrorName', 'sanitizedStack'],
  SERVER_STARTUP_FAILED: ['errorCode', 'sanitizedStack'],
  HEALTH_CHECK_FAILED: ['errorCode', 'operationalCategory'],
  AUTH_REGISTER_SUCCESS: PHASE14_OPTIONAL_FIELDS,
  AUTH_LOGIN_SUCCESS: PHASE14_OPTIONAL_FIELDS,
  AUTH_LOGIN_FAILED: PHASE14_OPTIONAL_FIELDS,
  AUTH_LOGOUT: PHASE14_OPTIONAL_FIELDS,
  AUTH_TOKEN_REFRESH_SUCCESS: PHASE14_OPTIONAL_FIELDS,
  AUTH_REFRESH_REUSE_DETECTED: PHASE14_OPTIONAL_FIELDS,
  AUTH_SESSION_REVOKED: PHASE14_OPTIONAL_FIELDS,
  AUTH_ACCESS_DENIED: PHASE14_OPTIONAL_FIELDS,
  AUTH_ACCOUNT_DISABLED: PHASE14_OPTIONAL_FIELDS,
  AUTH_RATE_LIMITED: PHASE14_OPTIONAL_FIELDS
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  let sanitized = str.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://[REDACTED_URI]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  if (process.env.POLICY_GOVERNANCE_SECRET) {
    sanitized = sanitized.split(process.env.POLICY_GOVERNANCE_SECRET).join('[REDACTED]');
  }
  if (process.env.GEMINI_API_KEY) {
    sanitized = sanitized.split(process.env.GEMINI_API_KEY).join('[REDACTED]');
  }

  // Absolute local path sanitization: unconditionally sanitizes /Users/<user> and /home/<user>
  // Even if containing node_modules (zero bypass)
  sanitized = sanitized.replace(/(?:\/Users\/[^\s\/\):]+|\/home\/[^\s\/\):]+)(?:\/[^\s\):]+)?(?::\d+)*/g, () => '[PATH]');

  return sanitized;
};

const redact = (val, depth = 0, seen = new WeakSet()) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return sanitizeString(val);
  if (typeof val !== 'object') return val;

  if (depth > 8) {
    return '[REDACTED_DEPTH_LIMIT]';
  }

  if (seen.has(val)) {
    return '[CIRCULAR]';
  }
  seen.add(val);

  if (Array.isArray(val)) {
    return val.map((item) => redact(item, depth + 1, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(val)) {
    if (/password|token|secret|authorization|key|auth|answers|selectedoptions|options/i.test(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redact(value, depth + 1, seen);
    }
  }
  return result;
};

const pickAllowedOptionalFields = (event, payload) => {
  const safe = {};
  if (!payload || typeof payload !== 'object') return safe;
  const allowed = EVENT_OPTIONAL_FIELDS[event] || [];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      safe[key] = payload[key];
    }
  }
  return safe;
};

const writeLog = (level, payload) => {
  try {
    const context = requestContext.getStore();
    const event = (PHASE13_LOG_EVENTS.has(payload?.event) || PHASE12_PRESERVED_EVENTS.has(payload?.event) || PHASE14_LOG_EVENTS.has(payload?.event))
      ? payload.event
      : 'LOG_EVENT';
    const safeOptionalFields = pickAllowedOptionalFields(event, payload);

    const fullPayload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      component: ['http', 'server', 'database', 'health', 'cli'].includes(payload?.component)
        ? payload.component
        : 'server',
      message: sanitizeString(payload?.message || ''),
      ...(context ? {
        correlationId: context.correlationId,
        method: context.method,
        normalizedRoute: context.normalizedRoute
      } : {}),
      ...safeOptionalFields
    };

    const redacted = redact(fullPayload);
    const line = JSON.stringify(redacted) + '\n';

    if (level === 'error') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  } catch (_err) {
    try {
      process.stderr.write(OBSERVABILITY_FAILSAFE_LINE);
    } catch (_failsafeErr) {
      // swallow permanently
    }
  }
};

const debug = (payload) => writeLog('debug', payload);
const info = (payload) => writeLog('info', payload);
const warn = (payload) => writeLog('warn', payload);
const error = (payload) => writeLog('error', payload);

module.exports = {
  debug,
  info,
  warn,
  error,
  redact,
  sanitizeString
};
