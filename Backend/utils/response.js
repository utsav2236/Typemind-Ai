// utils/response.js
// Standardizes all API responses to a consistent JSON shape.

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [data]
 */
export const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [extras]  e.g. { errors: [...] }
 */
export const errorResponse = (res, statusCode, message, extras = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extras,
  });
};
