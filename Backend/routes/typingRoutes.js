// routes/typingRoutes.js

import express from 'express';
import {
  submitSession,
  getSessions,
  getSessionById,
} from '../controllers/typingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, validateQuery } from '../middleware/validationMiddleware.js';
import { sessionSchema, sessionQuerySchema } from '../validators/typingValidator.js';

const router = express.Router();

router.use(protect); // All typing routes require authentication

router.post('/sessions',     validate(sessionSchema), submitSession);
router.get('/sessions',      validateQuery(sessionQuerySchema), getSessions);
router.get('/sessions/:id',  getSessionById);

export default router;
