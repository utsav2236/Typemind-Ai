// middleware/errorMiddleware.js
// Central error handler — catches all errors forwarded via next(err).

import { env } from '../config/env.js';

/**
 * Central error-handling middleware.
 * Must be registered LAST in Express, after all routes.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);

  if (env.isDevelopment) {
    console.error(err.stack);
  }

  // Default values
  let statusCode = err.statusCode || res.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join('. ');
  }

  // ── Mongoose Duplicate Key Error ──────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ── Mongoose Cast Error (bad ObjectId) ───────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // ── Response ──────────────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler — for unmatched routes.
 */
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};
