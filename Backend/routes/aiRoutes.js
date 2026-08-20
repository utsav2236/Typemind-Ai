// routes/aiRoutes.js

import express from 'express';
import {
  generatePractice,
  getAIAnalysis,
  getRecentAnalyses,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { generatePracticeSchema } from '../validators/aiValidator.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate-practice',         aiLimiter, validate(generatePracticeSchema), generatePractice);
router.get('/analyses',                   getRecentAnalyses);
router.get('/analysis/:sessionId',        getAIAnalysis);

export default router;
