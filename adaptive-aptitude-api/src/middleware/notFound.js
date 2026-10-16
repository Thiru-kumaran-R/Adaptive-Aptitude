'use strict';

/**
 * 404 handler — catches any request that did not match a registered route.
 * Must be registered AFTER all routes and BEFORE the error handler.
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

module.exports = notFound;
