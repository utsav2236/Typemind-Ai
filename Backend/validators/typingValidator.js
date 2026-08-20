// validators/typingValidator.js
// Joi schemas for typing session submission and history queries.

import Joi from 'joi';
import { SESSION_LIMITS } from '../utils/constants.js';

// ── Keystroke sub-schema ──────────────────────────────────────────────────────
const keystrokeSchema = Joi.object({
  key:          Joi.string().max(20).required(),
  expectedKey:  Joi.string().max(20).required(),
  correct:      Joi.boolean().required(),
  responseTime: Joi.number()
    .min(SESSION_LIMITS.MIN_RESPONSE_TIME)
    .max(SESSION_LIMITS.MAX_RESPONSE_TIME)
    .required(),
});

// ── Session submission schema ─────────────────────────────────────────────────
export const sessionSchema = Joi.object({
  mode: Joi.string()
    .valid('general', 'code', 'numbers', 'quotes', 'adaptive', 'custom')
    .default('general'),

  difficulty: Joi.string()
    .valid('beginner', 'easy', 'intermediate', 'advanced', 'expert', 'adaptive')
    .default('intermediate'),

  duration: Joi.number()
    .integer()
    .min(SESSION_LIMITS.MIN_DURATION)
    .max(SESSION_LIMITS.MAX_DURATION)
    .required()
    .messages({
      'number.min': `Duration must be at least ${SESSION_LIMITS.MIN_DURATION} seconds.`,
      'number.max': `Duration must not exceed ${SESSION_LIMITS.MAX_DURATION} seconds.`,
      'any.required': 'Duration is required.',
    }),

  text: Joi.string()
    .trim()
    .min(1)
    .max(SESSION_LIMITS.MAX_TEXT_LENGTH)
    .required()
    .messages({
      'any.required': 'Practice text is required.',
      'string.max': `Text must not exceed ${SESSION_LIMITS.MAX_TEXT_LENGTH} characters.`,
    }),

  keystrokes: Joi.array()
    .items(keystrokeSchema)
    .min(1)
    .max(SESSION_LIMITS.MAX_KEYSTROKES)
    .required()
    .messages({
      'array.max': `Too many keystrokes. Maximum is ${SESSION_LIMITS.MAX_KEYSTROKES}.`,
      'any.required': 'Keystroke data is required.',
    }),

  // Optional: timestamps from client (for additional cross-validation)
  startedAt:   Joi.date().iso().optional(),
  completedAt: Joi.date().iso().optional(),
});

// ── Session history query schema ──────────────────────────────────────────────
export const sessionQuerySchema = Joi.object({
  page:      Joi.number().integer().min(1).default(1),
  limit:     Joi.number().integer().min(1).max(50).default(10),
  sortBy:    Joi.string().valid('createdAt', 'wpm', 'accuracy').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  from:      Joi.date().iso().optional(),
  to:        Joi.date().iso().optional(),
  mode:      Joi.string().valid('general', 'code', 'numbers', 'quotes', 'adaptive', 'custom').optional(),
});
