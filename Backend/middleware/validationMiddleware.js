// middleware/validationMiddleware.js
// Runs a Joi schema against the request body and returns 400 on failure.

import { errorResponse } from '../utils/response.js';

/**
 * Returns an Express middleware that validates req.body against the given Joi schema.
 * @param {import('joi').ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // Collect all errors, not just the first
    stripUnknown: true,  // Remove unknown fields
    convert: true,       // Type coercion (e.g. "60" → 60)
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/"/g, "'"));
    return errorResponse(res, 400, 'Validation failed', { errors: messages });
  }

  // Replace req.body with the validated + sanitized value
  req.body = value;
  next();
};

/**
 * Returns an Express middleware that validates req.query against the given Joi schema.
 * @param {import('joi').ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/"/g, "'"));
    return errorResponse(res, 400, 'Invalid query parameters', { errors: messages });
  }

  req.query = value;
  next();
};
