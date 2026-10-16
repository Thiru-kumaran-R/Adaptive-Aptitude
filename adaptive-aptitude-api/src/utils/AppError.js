'use strict';

const { MOCK_HTTP_STATUS_MAP } = require('../config/mockConfig');

class AppError extends Error {
  /**
   * Constructs an AppError with an HTTP status code, machine-readable code, and descriptive message.
   * If statusCode is omitted or null, it falls back to MOCK_HTTP_STATUS_MAP[code] or 500.
   *
   * @param {number|null} statusCode HTTP status code (e.g. 400, 403, 404, 409, 500)
   * @param {string} code Error code from MOCK_ERROR_CODES
   * @param {string} message Error message
   */
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || MOCK_HTTP_STATUS_MAP[code] || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
