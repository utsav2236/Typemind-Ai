import express from 'express';
import { startGuestTest, submitGuestResult } from '../controllers/guestTypingController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiting for guest public endpoints
const guestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 10 minutes.'
  }
});

router.post('/start', guestLimiter, startGuestTest);
router.post('/result', guestLimiter, submitGuestResult);

export default router;
