'use strict';

/**
 * LearningError.js — Centralized Error Class for Phase 7
 */

const { LEARNING_HTTP_STATUS_MAP, LEARNING_ERROR_CODES } = require('../../config/learningConfig');

class LearningError extends Error {
  /**
   * Constructs a LearningError with an HTTP status code, machine-readable code, and descriptive message.
   *
   * @param {number|null} statusCode HTTP status code (e.g. 400, 403, 404, 409, 429, 500, 502, 503, 504)
   * @param {string} code Error code from LEARNING_ERROR_CODES
   * @param {string} message Error message
   */
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'LearningError';
    this.code = code || LEARNING_ERROR_CODES.LEARNING_CONTEXT_GENERATION_FAILED;
    this.statusCode = statusCode || LEARNING_HTTP_STATUS_MAP[this.code] || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = LearningError;
