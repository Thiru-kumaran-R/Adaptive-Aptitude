'use strict';

/**
 * Wraps an async Express route handler so that any rejected promise is
 * forwarded to next() — and therefore to the centralized errorHandler — 
 * without requiring a try/catch in every controller.
 *
 * @param {Function} fn  Async Express route handler (req, res, next) => Promise
 * @returns {Function}   Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
