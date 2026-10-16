'use strict';

/**
 * Rate Limiter Engine — Phase 14
 *
 * Implements a bounded fixed-window rate limiter with a single process-wide
 * registry Map shared across all four tiers.
 */

const crypto = require('node:crypto');
const authConfig = require('../config/authConfig');
const logger = require('../utils/logger');

// Single process-wide shared registry
const registry = new Map();

// Injectable clock for deterministic testing
let getTime = () => Date.now();

function setTimeSource(fn) {
  getTime = fn;
}

function resetTimeSource() {
  getTime = () => Date.now();
}

function sweepExpiredBuckets(now) {
  for (const [key, bucket] of registry.entries()) {
    if (bucket.resetAt <= now) {
      registry.delete(key);
    }
  }
}

// Single process-wide sweeper
const sweeperInterval = setInterval(() => sweepExpiredBuckets(getTime()), 60000);
sweeperInterval.unref();

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function getAuthRateLimitEmailComponent(req) {
  const email = req.body?.email;
  if (typeof email !== 'string') {
    return '__INVALID_EMAIL__';
  }
  return email.trim().toLowerCase();
}

function getRefreshRateLimitTokenComponent(req) {
  const rawToken = req.cookies?.refreshToken;
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    return '__MISSING_OR_INVALID_REFRESH__';
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Core limiter logic for a given key, limit, and windowMs
 */
function checkRateLimit(key, limit, windowMs) {
  const now = getTime();
  const maxKeys = authConfig.RATE_LIMIT_MAX_KEYS;

  let bucket = registry.get(key);

  if (bucket) {
    if (bucket.resetAt <= now) {
      // Window expired; reset bucket
      bucket.count = 1;
      bucket.resetAt = now + windowMs;
      return { allowed: true };
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, capacityExceeded: false, retryAfter };
    }

    bucket.count += 1;
    return { allowed: true };
  }

  // Key is not in registry; check aggregate capacity bound
  if (registry.size >= maxKeys) {
    sweepExpiredBuckets(now);
    if (registry.size >= maxKeys) {
      return { allowed: false, capacityExceeded: true, retryAfter: 60 };
    }
  }

  // Allocate new bucket
  registry.set(key, {
    count: 1,
    resetAt: now + windowMs
  });

  return { allowed: true };
}

function createRateLimiterMiddleware({ keyExtractor, getLimit, getWindowMs }) {
  return (req, res, next) => {
    const key = keyExtractor(req);
    const limit = getLimit();
    const windowMs = getWindowMs();

    const result = checkRateLimit(key, limit, windowMs);

    if (result.allowed) {
      return next();
    }

    if (result.capacityExceeded) {
      logger.warn({
        event: 'AUTH_RATE_LIMITED',
        component: 'http',
        statusCode: 429,
        errorCode: 'RATE_LIMIT_CAPACITY_EXCEEDED',
        reason: 'CAPACITY_EXCEEDED',
        message: 'Rate limit capacity exceeded'
      });
      res.setHeader('Retry-After', String(result.retryAfter));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_CAPACITY_EXCEEDED',
          message: 'Service capacity exceeded. Please retry later.'
        }
      });
    }

    logger.warn({
      event: 'AUTH_RATE_LIMITED',
      component: 'http',
      statusCode: 429,
      errorCode: 'TOO_MANY_REQUESTS',
      reason: 'LIMIT_EXCEEDED',
      message: 'Rate limit exceeded'
    });
    res.setHeader('Retry-After', String(result.retryAfter));
    return res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please retry later.'
      }
    });
  };
}

// Tier 1: Global IP Limiter
const globalRateLimiter = createRateLimiterMiddleware({
  keyExtractor: (req) => `ip:${getClientIp(req)}`,
  getLimit: () => authConfig.RATE_LIMIT_GLOBAL_MAX,
  getWindowMs: () => authConfig.RATE_LIMIT_GLOBAL_WINDOW_MS
});

// Tier 2: Auth (Register / Login) Limiter
const authRateLimiter = createRateLimiterMiddleware({
  keyExtractor: (req) => `auth:${getClientIp(req)}:${getAuthRateLimitEmailComponent(req)}`,
  getLimit: () => authConfig.RATE_LIMIT_AUTH_MAX,
  getWindowMs: () => authConfig.RATE_LIMIT_AUTH_WINDOW_MS
});

// Tier 3: Refresh Limiter
const refreshRateLimiter = createRateLimiterMiddleware({
  keyExtractor: (req) => `ref:${getClientIp(req)}:${getRefreshRateLimitTokenComponent(req)}`,
  getLimit: () => authConfig.RATE_LIMIT_REFRESH_MAX,
  getWindowMs: () => authConfig.RATE_LIMIT_REFRESH_WINDOW_MS
});

// Tier 4: LLM Limiter (keyed by req.user.userId)
const llmRateLimiter = createRateLimiterMiddleware({
  keyExtractor: (req) => `llm:${req.user?.userId || 'unknown'}`,
  getLimit: () => authConfig.RATE_LIMIT_LLM_MAX,
  getWindowMs: () => authConfig.RATE_LIMIT_LLM_WINDOW_MS
});

// Helpers for test teardown / inspection
function _getRegistry() {
  return registry;
}

function _clearRegistryForTesting() {
  registry.clear();
}

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  refreshRateLimiter,
  llmRateLimiter,
  getAuthRateLimitEmailComponent,
  getRefreshRateLimitTokenComponent,
  sweepExpiredBuckets,
  setTimeSource,
  resetTimeSource,
  _getRegistry,
  _clearRegistryForTesting
};
