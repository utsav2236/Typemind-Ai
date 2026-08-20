// routes/leaderboardRoutes.js

import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Leaderboard is public-viewable but requires auth to see rank context
router.get('/', protect, getLeaderboard);

export default router;
