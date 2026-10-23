/**
 * CampusOS v1.2 — Central Error Handler Middleware
 */
const config = require('../config');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = config.nodeEnv === 'production';

  // Log server internal errors
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    status: 'error',
    code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    message: err.message || 'An unexpected error occurred.',
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = errorHandler;
