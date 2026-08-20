// app.js
// Express application factory.
// Configures all middleware, routes, and error handlers.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes        from './routes/authRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import typingRoutes      from './routes/typingRoutes.js';
import analyticsRoutes   from './routes/analyticsRoutes.js';
import aiRoutes          from './routes/aiRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import guestTypingRoutes from './routes/guestTypingRoutes.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = env.clientUrl.split(',').map(u => u.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      const normalizedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));
      const reqOrigin = origin.replace(/\/$/, '');
      
      if (normalizedOrigins.includes(reqOrigin)) {
        return callback(null, true);
      }
      
      // Automatically allow all localhost connections for local development
      if (reqOrigin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,    // Allow cookies (for JWT HTTP-only cookie)
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Cookie parsing ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── General rate limiting ─────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Health check (no auth required) ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.status(200).json({
    success:   true,
    message:   'TypeMind AI API is running',
    database:  dbStatus,
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/typing/guest', guestTypingRoutes);
app.use('/api/typing',       typingRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/leaderboard',  leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ── Central error handler (MUST be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
