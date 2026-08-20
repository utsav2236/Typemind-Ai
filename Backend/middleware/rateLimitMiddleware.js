// middleware/rateLimitMiddleware.js
// Separate rate limiters for auth, general API, and AI endpoints.

import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

const makeMessage = (windowMinutes, max) =>
  `Too many requests. Limit is ${max} per ${windowMinutes} minutes. Please try again later.`;

/**
 * Authentication rate limiter — strict to prevent brute force.
 * 10 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: { success: false, message: makeMessage(15, RATE_LIMITS.AUTH.max) },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Resend verification email rate limiter.
 * 3 requests per 15 minutes.
 */
export const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { success: false, message: 'Too many resend requests. Limit is 3 per 15 minutes. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter.
 * 100 requests per 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  message: { success: false, message: makeMessage(15, RATE_LIMITS.GENERAL.max) },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * AI endpoint rate limiter — stricter due to cost.
 * 20 requests per 60 minutes.
 */
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMITS.AI.windowMs,
  max: RATE_LIMITS.AI.max,
  message: { success: false, message: 'AI request limit reached. Please wait before generating more content.' },
  standardHeaders: true,
  legacyHeaders: false,
});
