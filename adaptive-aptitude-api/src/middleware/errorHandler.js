'use strict';

const logger = require('../utils/logger');
const requestContext = require('../utils/requestContext');
const { determineNormalizedRoute } = require('./metricsMiddleware');

/**
 * Classifies an error into an observational category.
 * Purely observational metadata, never alters response.
 */
const classifyOperationalError = ({ code, statusCode }) => {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'CLIENT_VALIDATION';
    case 'POLICY_VERSION_ALREADY_EXISTS':
      return 'GOVERNANCE_CONFLICT';
    case 'IMMUTABLE_FIELD_MUTATION':
    case 'LIFECYCLE_MUTATION_PROHIBITED':
    case 'DIRECT_QUERY_UPDATE_PROHIBITED':
    case 'DIRECT_MODEL_WRITE_PROHIBITED':
    case 'UNAUTHORIZED_DELETION':
      return 'INTEGRITY_PROTECTION_VIOLATION';
    case 'ROUTE_NOT_FOUND':
      return 'CLIENT_NOT_FOUND';
    case 'DB_ERROR':
    case 'INTERNAL_SERVER_ERROR':
      return 'INFRASTRUCTURE_FAULT';
    default:
      if (statusCode >= 500) return 'INFRASTRUCTURE_FAULT';
      if (statusCode >= 400) return 'CLIENT_ERROR';
      return 'OPERATIONAL_UNCLASSIFIED';
  }
};

/**
 * Dispatches the log level for HTTP error logs.
 * Telemetry-only, never alters response.
 */
const selectOperationalLogLevel = ({ code, statusCode }) => {
  switch (code) {
    case 'VALIDATION_ERROR':
    case 'POLICY_VERSION_ALREADY_EXISTS':
    case 'IMMUTABLE_FIELD_MUTATION':
    case 'LIFECYCLE_MUTATION_PROHIBITED':
    case 'DIRECT_QUERY_UPDATE_PROHIBITED':
    case 'DIRECT_MODEL_WRITE_PROHIBITED':
    case 'UNAUTHORIZED_DELETION':
      return 'warn';

    case 'ROUTE_NOT_FOUND':
      return 'info';

    case 'DB_ERROR':
    case 'INTERNAL_SERVER_ERROR':
      return 'error';

    default:
      if (statusCode >= 500) return 'error';
      if (statusCode >= 400) return 'warn';
      return 'info';
  }
};

/**
 * Centralized Express error handler.
 * Must be registered LAST with app.use().
 */
const errorHandler = (err, req, res, next) => {
  // 1. Initial base values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal Server Error';

  // 2. Preserve proven pre-Phase-13 legacy error translations (Legacy Phase 1-12 compatibility)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    message = messages.length > 0 ? messages.join('; ') : err.message;
  } else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'A record with the provided unique fields already exists.';
  }

  // 3. Determine telemetry route identity using effective status code before logging
  const bestRoute = determineNormalizedRoute(req, res, statusCode);
  requestContext.setNormalizedRoute(bestRoute);

  // 4. Telemetry classification & severity selection (purely observational, NEVER alters response)
  const operationalCategory = classifyOperationalError({ code, statusCode });
  const logLevel = selectOperationalLogLevel({ code, statusCode });

  // 5. Emit sanitized structured log at matching severity
  logger[logLevel]({
    event: 'HTTP_REQUEST_ERROR',
    component: 'http',
    message: logger.sanitizeString(message),
    statusCode,
    errorCode: code,
    operationalCategory,
    sanitizedStack: err.stack ? logger.sanitizeString(err.stack) : undefined
  });

  // 6. Return exact public DTO and status code across ALL environments
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};

module.exports = errorHandler;
module.exports.classifyOperationalError = classifyOperationalError;
module.exports.selectOperationalLogLevel = selectOperationalLogLevel;
