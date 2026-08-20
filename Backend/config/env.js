// config/env.js
// Validates and exports all required environment variables.
// The app fails fast at startup if critical vars are missing.

import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'https://typemind-ai.onrender.com',
  aiApiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  aiBaseUrl: process.env.AI_BASE_URL || '',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // Email Verification
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  emailFrom: process.env.EMAIL_FROM || 'noreply@typemind.ai',
  emailVerificationExpiresMinutes: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES, 10) || 30,
};
