'use strict';

/**
 * Send a successful JSON response.
 *
 * Shape:
 *   { success: true, data: <data>, meta: <meta> }
 *
 * @param {import('express').Response} res
 * @param {*}      data        Response payload (array or object)
 * @param {Object} [meta={}]   Optional metadata (pagination, counts, etc.)
 * @param {number} [status=200] HTTP status code
 */
const sendSuccess = (res, data, meta = {}, status = 200) => {
  const body = { success: true };

  if (data !== undefined) {
    body.data = data;
  }

  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta;
  }

  return res.status(status).json(body);
};

/**
 * Send an error JSON response.
 *
 * Shape:
 *   { success: false, error: { code: <code>, message: <message> } }
 *
 * @param {import('express').Response} res
 * @param {string} code     Machine-readable error code (e.g. 'INVALID_TOPIC')
 * @param {string} message  Human-readable description
 * @param {number} [status=500] HTTP status code
 */
const sendError = (res, code, message, status = 500) => {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { sendSuccess, sendError };
