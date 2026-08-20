// controllers/authController.js
// Handles register, login, logout, and getMe.

import crypto from 'crypto';
import User from '../models/User.js';
import generateToken, { clearToken } from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // confirmPassword is validated by Joi but not stored

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return errorResponse(res, 409, 'Email already registered. Please log in.');
      } else {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        existingUser.emailVerificationToken = hashedToken;
        existingUser.emailVerificationExpires = Date.now() + env.emailVerificationExpiresMinutes * 60 * 1000;
        await existingUser.save();
        
        const verificationUrl = `${env.frontendUrl}/verify-email/${rawToken}`;
        sendVerificationEmail({ email: existingUser.email, name: existingUser.name, verificationUrl }).catch(e => console.error(e));
        
        return successResponse(res, 200, 'A new verification email has been sent.');
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({ 
      name, 
      email, 
      password,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + env.emailVerificationExpiresMinutes * 60 * 1000,
    });

    const verificationUrl = `${env.frontendUrl}/verify-email/${rawToken}`;
    
    sendVerificationEmail({ email: user.email, name: user.name, verificationUrl }).catch(err => {
      console.error('[authController] Failed to send email upon registration', err);
    });

    return successResponse(res, 201, 'Account created. Please verify your email before logging in.', {
      requiresEmailVerification: true,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates a user and issues a JWT cookie.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Include password for comparison (select: false by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in.',
      });
    }

    const token = generateToken(res, user._id.toString());

    return successResponse(res, 200, 'Login successful.', {
      user: user.toPublicJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
export const logout = (req, res) => {
  clearToken(res);
  return successResponse(res, 200, 'Logged out successfully.');
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export const getMe = (req, res) => {
  // req.user is set by authMiddleware
  return successResponse(res, 200, 'User retrieved.', { user: req.user });
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return errorResponse(res, 400, 'Token is required.');

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'This verification link is invalid.',
      });
    }

    if (user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'Your verification link has expired.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return successResponse(res, 200, 'Email verified successfully.');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, 'Email is required.');

    const user = await User.findOne({ email });
    
    // Prevent email enumeration
    if (!user) {
      return successResponse(res, 200, 'If an account exists with this email, a verification message has been sent.');
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 400, 'Email is already verified.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + env.emailVerificationExpiresMinutes * 60 * 1000;
    await user.save();

    const verificationUrl = `${env.frontendUrl}/verify-email/${rawToken}`;
    
    sendVerificationEmail({ email: user.email, name: user.name, verificationUrl }).catch(err => {
      console.error('[authController] Failed to send email upon resend', err);
    });

    return successResponse(res, 200, 'If an account exists with this email, a verification message has been sent.');
  } catch (err) {
    next(err);
  }
};
