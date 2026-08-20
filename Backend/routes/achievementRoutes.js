// routes/achievementRoutes.js

import express from 'express';
import { getAchievements, getRecentAchievements } from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/',        getAchievements);
router.get('/recent',  getRecentAchievements);

export default router;
