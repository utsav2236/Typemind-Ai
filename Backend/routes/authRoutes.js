// routes/authRoutes.js

import express from 'express';
import { register, login, logout, getMe, verifyEmail, resendVerification } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { authLimiter, resendLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login',    authLimiter, validate(loginSchema),    login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendLimiter, resendVerification);
router.post('/logout',   logout);
router.get('/me',        protect, getMe);

export default router;
