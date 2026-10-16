'use strict';

/**
 * src/middleware/authenticate.js
 * Authoritative Access JWT Authentication Middleware — Phase 14
 *
 * Enforces mandatory cryptographic verification, keyring kid resolution,
 * structural claim validation, and populates req.user. 100% stateless (0 DB queries).
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const pathWithoutQuery = (req.originalUrl || '').split('?')[0];
  const normalizedPath = req.baseUrl ? (req.baseUrl + req.path) : pathWithoutQuery;
  const isTombstone =
    (req.method === 'POST' && (normalizedPath === '/api/v1/users' || pathWithoutQuery === '/api/v1/users')) ||
    (req.method === 'POST' && (normalizedPath === '/api/v1/mock-blueprints' || pathWithoutQuery === '/api/v1/mock-blueprints'));

  if (isTombstone) {
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.trim().split(/\s+/);
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        try {
          const decoded = authService.verifyAccessToken(parts[1]);
          req.user = {
            userId: decoded.sub,
            sessionId: decoded.sid,
            accessTokenId: decoded.jti,
            issuedAt: decoded.iat,
            expiresAt: decoded.exp
          };
        } catch {
          // Proceed to tombstone handler without req.user
        }
      }
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    logger.warn({
      event: 'AUTH_ACCESS_DENIED',
      component: 'http',
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      operationalCategory: 'RATE_LIMIT',
      reason: 'MISSING_AUTHORIZATION_HEADER',
      message: 'Authentication header missing'
    });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required to access this resource.'
      }
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    logger.warn({
      event: 'AUTH_ACCESS_DENIED',
      component: 'http',
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      reason: 'MALFORMED_AUTHORIZATION_HEADER',
      message: 'Authentication header format invalid'
    });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required to access this resource.'
      }
    });
  }

  const token = parts[1];
  try {
    const decoded = authService.verifyAccessToken(token);
    req.user = {
      userId: decoded.sub,
      sessionId: decoded.sid,
      accessTokenId: decoded.jti,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp
    };
    return next();
  } catch (err) {
    const statusCode = err.statusCode || 401;
    const errorCode = err.code || 'INVALID_TOKEN';
    const message = err.message || 'Access token is invalid or malformed.';

    logger.warn({
      event: 'AUTH_ACCESS_DENIED',
      component: 'http',
      statusCode,
      errorCode,
      reason: errorCode,
      message: 'Access token verification failed'
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message
      }
    });
  }
}

module.exports = authenticate;
