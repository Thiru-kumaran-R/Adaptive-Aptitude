const crypto = require('node:crypto');
const requestContext = require('../utils/requestContext');

const CORRELATION_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Express middleware extracting/sanitizing correlation ID, attaching X-Correlation-ID
 * with failure isolation, and initializing requestContext boundary.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const correlationMiddleware = (req, res, next) => {
  const rawHeader = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  let effectiveCorrelationId = typeof rawHeader === 'string' ? rawHeader.trim() : '';

  if (!CORRELATION_ID_REGEX.test(effectiveCorrelationId)) {
    effectiveCorrelationId = crypto.randomUUID();
  }

  // Response header attachment is strictly failure-isolated:
  try {
    res.setHeader('X-Correlation-ID', effectiveCorrelationId);
  } catch (_err) {
    // Observability failure isolation: continue request without failing transaction or blocking next()
  }

  const method = typeof req.method === 'string' ? req.method.toUpperCase() : 'GET';

  requestContext.run(
    {
      correlationId: effectiveCorrelationId,
      method,
      normalizedRoute: 'UNRESOLVED'
    },
    () => next()
  );
};

module.exports = correlationMiddleware;
