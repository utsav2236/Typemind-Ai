// validators/authValidator.js
// Joi schemas for register and login endpoints.

import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must not exceed 50 characters.',
    'any.required': 'Name is required.',
  }),

  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.',
  }),

  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters.',
    'string.max': 'Password must not exceed 128 characters.',
    'any.required': 'Password is required.',
  }),

  confirmPassword: Joi.string()
    .required()
    .custom((value, helpers) => {
      // helpers.state.ancestors[0] is the parent object being validated
      const parent = helpers.state.ancestors[0];
      if (value !== parent.password) {
        return helpers.error('any.only');
      }
      return value;
    })
    .messages({
      'any.only': 'Passwords do not match.',
      'any.required': 'Please confirm your password.',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required.',
  }),
});
