// utils/generateToken.js
// JWT creation and HTTP-only cookie injection.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT for a user and attach it as an HTTP-only cookie.
 * @param {import('express').Response} res
 * @param {string} userId  - MongoDB ObjectId string
 * @returns {string} The signed JWT
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  // Parse jwtExpiresIn (e.g. "7d") to milliseconds for cookie maxAge
  const ms = parseDuration(env.jwtExpiresIn);

  res.cookie('jwt', token, {
    httpOnly: true,                             // Not accessible via JS
    secure: env.isProduction,                  // HTTPS only in production
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: ms,
  });

  return token;
};

/**
 * Parse a duration string like "7d", "24h", "3600s" → milliseconds.
 * @param {string} duration
 * @returns {number}
 */
const parseDuration = (duration) => {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000; // default 7d
  }
};

/**
 * Clear the JWT cookie (used on logout).
 * @param {import('express').Response} res
 */
export const clearToken = (res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
};

export default generateToken;
