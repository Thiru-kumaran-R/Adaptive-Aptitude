'use strict';

/**
 * Security Headers & Hardened CORS Middleware — Phase 14
 *
 * Implements strict security headers (no Node HSTS) and hardened CORS.
 */

const authConfig = require('../config/authConfig');

/**
 * Security Headers Middleware (Stage 3 in middleware pipeline)
 */
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Cache-Control for auth endpoints
  if (req.originalUrl && req.originalUrl.startsWith('/api/v1/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  next();
}

/**
 * Hardened CORS Middleware (Stage 7 in middleware pipeline)
 */
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Requests with no Origin header (e.g. server-to-server, curl, health probes) are allowed
  if (!origin) {
    return next();
  }

  const allowedOrigins = authConfig.CORS_ALLOWED_ORIGINS;

  if (!allowedOrigins.has(origin)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ORIGIN_DENIED',
        message: 'Origin is not allowed.'
      }
    });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'X-Correlation-ID, Retry-After'
  );

  if (req.method === 'OPTIONS') {
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Correlation-ID, X-Request-ID'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  next();
}

module.exports = {
  securityHeadersMiddleware,
  corsMiddleware
};
