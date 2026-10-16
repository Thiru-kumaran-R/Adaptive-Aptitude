const { performance } = require('node:perf_hooks');
const requestContext = require('../utils/requestContext');
const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

const MAX_ROUTE_TEMPLATES = 30;
const FIXED_OPERATIONAL_ROUTES = new Set([
  '/health',
  '/health/live',
  '/health/ready',
  '/metrics'
]);
const MAX_DYNAMIC_APPLICATION_ROUTE_TEMPLATES =
  MAX_ROUTE_TEMPLATES - FIXED_OPERATIONAL_ROUTES.size; // 26

const knownDynamicApplicationRoutes = new Set();

const getBoundedRouteTemplate = (template) => {
  if (FIXED_OPERATIONAL_ROUTES.has(template)) {
    return template;
  }
  if (knownDynamicApplicationRoutes.has(template)) {
    return template;
  }
  if (knownDynamicApplicationRoutes.size >= MAX_DYNAMIC_APPLICATION_ROUTE_TEMPLATES) {
    return 'OTHER';
  }
  knownDynamicApplicationRoutes.add(template);
  return template;
};

/**
 * Mechanically derives the normalized route template for a request/response pair using effective status code.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {number|string} [effectiveStatusCode]
 * @returns {string}
 */
const determineNormalizedRoute = (req, res, effectiveStatusCode = res?.statusCode) => {
  // 1. Matched business / probe route (req.route resolved)
  if (req?.route && req.route.path) {
    const rawTemplate = `${req.baseUrl || ''}${req.route.path}`;
    return getBoundedRouteTemplate(rawTemplate);
  }

  // 2. Normal 404 unmatched route (completed request or error with effective status 404, no req.route)
  if (Number(effectiveStatusCode) === 404) {
    return 'UNMATCHED';
  }

  // 3. Pre-route failure (e.g. malformed JSON in express.json() before route resolution)
  return 'UNRESOLVED';
};

const ALLOWED_METRIC_HTTP_METHODS = new Set([
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'
]);

/**
 * Normalizes HTTP methods to the canonical 8-value metric enum.
 * @param {string} method
 * @returns {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS'|'HEAD'|'OTHER'}
 */
const normalizeHttpMethod = (method) => {
  if (typeof method !== 'string') return 'OTHER';
  const upper = method.toUpperCase();
  return ALLOWED_METRIC_HTTP_METHODS.has(upper) ? upper : 'OTHER';
};

/**
 * Normalizes HTTP status codes to canonical status class strings.
 * @param {number|string} statusCode
 * @returns {'2xx'|'3xx'|'4xx'|'5xx'|'OTHER'}
 */
const normalizeStatusClass = (statusCode) => {
  const code = Number(statusCode);
  if (code >= 200 && code < 300) return '2xx';
  if (code >= 300 && code < 400) return '3xx';
  if (code >= 400 && code < 500) return '4xx';
  if (code >= 500 && code < 600) return '5xx';
  return 'OTHER';
};

let activeRequestCount = 0;

/**
 * Returns the current authoritative in-flight request count.
 * @returns {number}
 */
const getActiveRequestCount = () => activeRequestCount;

/**
 * Express middleware tracking authoritative activeRequestCount and finalizing telemetry.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = performance.now();
  activeRequestCount++;

  try {
    metrics.setGauge('http_active_requests', {}, activeRequestCount);
  } catch (_err) {}

  let completed = false;
  const finalize = () => {
    if (completed) return;
    completed = true;

    // 1. Decrement authoritative activeRequestCount exactly once
    activeRequestCount = Math.max(0, activeRequestCount - 1);

    // 2. Mirror active request gauge best-effort
    try {
      metrics.setGauge('http_active_requests', {}, activeRequestCount);
    } catch (_err) {}

    // 3. Determine normalizedRoute mechanically using effective status
    const normalizedRoute = determineNormalizedRoute(req, res, res.statusCode);

    // 4. Update AsyncLocalStorage normalizedRoute before logging
    requestContext.setNormalizedRoute(normalizedRoute);

    // 5. Normalize metric method
    const metricMethod = normalizeHttpMethod(req.method);

    // 6. Normalize status class
    const statusClass = normalizeStatusClass(res.statusCode);

    // 7. Record http_requests_total
    try {
      metrics.incrementCounter('http_requests_total', {
        method: metricMethod,
        route: normalizedRoute,
        statusClass
      });
    } catch (_err) {}

    // 8. Record http_request_duration_ms
    const durationMs = performance.now() - startTime;
    try {
      metrics.recordHistogram('http_request_duration_ms', {
        method: metricMethod,
        route: normalizedRoute
      }, durationMs);
    } catch (_err) {}

    // 9. Emit HTTP_REQUEST_COMPLETED structured log
    try {
      logger.info({
        event: 'HTTP_REQUEST_COMPLETED',
        component: 'http',
        message: 'HTTP request completed',
        statusCode: res.statusCode,
        durationMs
      });
    } catch (_err) {}
  };

  res.once('finish', finalize);
  res.once('close', finalize);

  next();
};

const resetRoutesForTesting = () => {
  knownDynamicApplicationRoutes.clear();
};

module.exports = {
  metricsMiddleware,
  getActiveRequestCount,
  determineNormalizedRoute,
  normalizeHttpMethod,
  normalizeStatusClass,
  resetRoutesForTesting
};

