// middleware/authMiddleware.js
// Reads JWT from HTTP-only cookie, verifies it, and attaches req.user.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

/**
 * Protect middleware — authenticate every request.
 * Reads JWT from the 'jwt' HTTP-only cookie.
 * On success: attaches req.user (without password field).
 * On failure: returns 401 Unauthorized.
 */
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authenticated. Please log in.');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid token. Please log in again.';
      return errorResponse(res, 401, message);
    }

    // Find user (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Admin guard — must be used after protect.
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return errorResponse(res, 403, 'Access denied. Admin only.');
  }
  next();
};
