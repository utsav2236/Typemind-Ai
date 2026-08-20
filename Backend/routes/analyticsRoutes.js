// routes/analyticsRoutes.js

import express from 'express';
import {
  getOverview,
  getProgress,
  getWeaknesses,
  getKeyPerformance,
  getFingerPerformance,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/overview',           getOverview);
router.get('/progress',           getProgress);
router.get('/weaknesses',         getWeaknesses);
router.get('/key-performance',    getKeyPerformance);
router.get('/finger-performance', getFingerPerformance);

export default router;
