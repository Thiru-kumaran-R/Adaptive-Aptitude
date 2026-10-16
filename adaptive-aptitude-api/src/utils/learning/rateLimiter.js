'use strict';

/**
 * rateLimiter.js — Process-Local In-Memory Rate Limiting
 *
 * Enforces V1 process-local operational execution limits:
 * - 30 requests / hour / user (sliding window)
 * - 2 concurrent requests / user
 *
 * Stateless with respect to MongoDB (zero new collections).
 */

const { LEARNING_RATE_LIMITS, LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const LearningError = require('./LearningError');

// Map: userId -> Array<timestampMs>
const requestTimestamps = new Map();
// Map: userId -> number of concurrent active requests
const activeRequests = new Map();

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Checks and records a request under the user rate limit.
 *
 * @param {string} userId
 * @throws {LearningError} If rate limits are exceeded
 */
function checkRateLimit(userId) {
  if (!userId) return;

  const now = Date.now();

  // 1. Check concurrent requests
  const currentConcurrent = activeRequests.get(userId) || 0;
  if (currentConcurrent >= LEARNING_RATE_LIMITS.maxConcurrentRequests) {
    throw new LearningError(
      429,
      LEARNING_ERROR_CODES.LEARNING_RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: maximum ${LEARNING_RATE_LIMITS.maxConcurrentRequests} concurrent requests per user.`
    );
  }

  // 2. Check hourly requests (sliding window)
  const timestamps = requestTimestamps.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < ONE_HOUR_MS);

  if (validTimestamps.length >= LEARNING_RATE_LIMITS.maxRequestsPerHour) {
    throw new LearningError(
      429,
      LEARNING_ERROR_CODES.LEARNING_RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: maximum ${LEARNING_RATE_LIMITS.maxRequestsPerHour} requests per hour.`
    );
  }

  // Record this request
  validTimestamps.push(now);
  requestTimestamps.set(userId, validTimestamps);
}

/**
 * Acquires a concurrent request slot for a user.
 *
 * @param {string} userId
 */
function acquireConcurrency(userId) {
  if (!userId) return;
  const current = activeRequests.get(userId) || 0;
  activeRequests.set(userId, current + 1);
}

/**
 * Releases a concurrent request slot for a user.
 *
 * @param {string} userId
 */
function releaseConcurrency(userId) {
  if (!userId) return;
  const current = activeRequests.get(userId) || 0;
  if (current <= 1) {
    activeRequests.delete(userId);
  } else {
    activeRequests.set(userId, current - 1);
  }
}

/**
 * Reset rate limit storage. Useful for hermetic test execution.
 */
function resetRateLimits() {
  requestTimestamps.clear();
  activeRequests.clear();
}

module.exports = {
  checkRateLimit,
  acquireConcurrency,
  releaseConcurrency,
  resetRateLimits,
};
