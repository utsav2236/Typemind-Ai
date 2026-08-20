// validators/aiValidator.js
// Joi schemas for AI endpoints.

import Joi from 'joi';
import { SESSION_LIMITS } from '../utils/constants.js';

export const generatePracticeSchema = Joi.object({
  duration: Joi.number()
    .integer()
    .min(SESSION_LIMITS.MIN_DURATION)
    .max(SESSION_LIMITS.MAX_DURATION)
    .default(60),

  difficulty: Joi.string()
    .valid('beginner', 'easy', 'intermediate', 'advanced', 'expert', 'adaptive')
    .default('adaptive'),

  mode: Joi.string()
    .valid('general', 'code', 'numbers', 'quotes', 'adaptive', 'custom')
    .default('general'),
});
