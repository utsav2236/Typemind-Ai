// server.js
// Application entry point.
// Connects to MongoDB then starts the HTTP server.

import './config/env.js';  // Validate env vars first (fail-fast)
import app from './app.js';
import connectDB from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  // Connect to MongoDB before accepting requests
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`[Server] TypeMind AI API running in ${env.nodeEnv} mode on port ${env.port}`);
    console.log(`[Server] Health check: http://localhost:${env.port}/api/health`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[Server] Unhandled Rejection:', err.message);
    gracefulShutdown('unhandledRejection');
  });
};

startServer();
