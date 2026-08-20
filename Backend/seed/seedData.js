// seed/seedData.js
// Development database seeder.
// Run with: npm run seed
// WARNING: Clears existing data. Do NOT run in production.

import './config/env.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import { env } from '../config/env.js';

import User from '../models/User.js';
import TypingSession from '../models/TypingSession.js';
import KeyPerformance from '../models/KeyPerformance.js';
import WordPerformance from '../models/WordPerformance.js';
import AIAnalysis from '../models/AIAnalysis.js';
import Achievement from '../models/Achievement.js';

import { ACHIEVEMENTS } from '../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// GUARD
// ─────────────────────────────────────────────────────────────────────────────
if (env.isProduction) {
  console.error('[Seed] Cannot run seed in production!');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_TEXTS = [
  'The quick brown fox jumps over the lazy dog near the peaceful river bank.',
  'Programming requires patience, practice, and a persistent desire to improve your skills.',
  'Professional typists can reach speeds of over one hundred words per minute with proper training.',
  'The application processes requests asynchronously to provide a responsive user experience.',
  'Proper posture and finger placement are essential components of efficient touch typing.',
  'Every practice session builds muscle memory that helps improve your typing speed and accuracy.',
  'The rapid development of technology has transformed how people communicate and work daily.',
  'Persistence in practice leads to gradual but consistent improvement in typing performance.',
];

/**
 * Generate a realistic keystroke array for a given text and target WPM.
 */
const generateKeystrokes = (text, targetWpm, accuracy = 95) => {
  const keystrokes = [];
  const baseResponseTime = Math.round((60 / (targetWpm * 5)) * 1000); // ms per character

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ') {
      keystrokes.push({
        key: ' ',
        expectedKey: ' ',
        correct: true,
        responseTime: baseResponseTime * 0.5 + Math.random() * 50,
      });
      continue;
    }

    const isCorrect = Math.random() * 100 < accuracy;
    const responseTime = Math.max(50, baseResponseTime + (Math.random() - 0.5) * baseResponseTime);

    keystrokes.push({
      key:          isCorrect ? char : String.fromCharCode(char.charCodeAt(0) + 1),
      expectedKey:  char,
      correct:      isCorrect,
      responseTime: Math.round(responseTime),
    });
  }

  return keystrokes;
};

/**
 * Generate a realistic typing session for a user.
 */
const generateSession = (userId, options = {}) => {
  const {
    wpm        = 60 + Math.random() * 30,
    accuracy   = 90 + Math.random() * 8,
    mode       = 'general',
    difficulty = 'intermediate',
    daysAgo    = 0,
  } = options;

  const duration = 60;
  const text     = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
  const keystrokes = generateKeystrokes(text, wpm, accuracy);

  const correctChars   = keystrokes.filter((k) => k.correct && k.key !== 'Backspace').length;
  const incorrectChars = keystrokes.filter((k) => !k.correct && k.key !== 'Backspace').length;
  const totalChars     = correctChars + incorrectChars;

  const realWpm      = Math.round((correctChars / 5 / (duration / 60)) * 10) / 10;
  const realRawWpm   = Math.round((totalChars / 5 / (duration / 60)) * 10) / 10;
  const realAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100 * 100) / 100 : 100;
  const consistency  = 75 + Math.random() * 20;

  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    user:                userId,
    mode,
    difficulty,
    duration,
    text,
    wpm:                 realWpm,
    rawWpm:              realRawWpm,
    accuracy:            realAccuracy,
    consistency:         Math.round(consistency),
    correctCharacters:   correctChars,
    incorrectCharacters: incorrectChars,
    totalCharacters:     totalChars,
    totalWords:          text.split(' ').length,
    completedWords:      Math.floor(correctChars / 5),
    errorCount:          Math.floor(incorrectChars / 3),
    backspaces:          Math.floor(Math.random() * 10),
    averageResponseTime: 120 + Math.round(Math.random() * 100),
    weakKeys:            ['p', 'r', ';'].slice(0, Math.floor(Math.random() * 3)).map((k) => ({
      key: k, accuracy: 60 + Math.random() * 20, errorRate: 20 + Math.random() * 20,
      averageResponseTime: 200 + Math.random() * 100, attempts: 5 + Math.floor(Math.random() * 10),
    })),
    weakWords: [],
    weakFingers: [],
    keyPerformance: {},
    fingerPerformance: {},
    wordPerformance: {},
    typingIQ: 70 + Math.floor(Math.random() * 30),
    iqLevel: 'Intermediate',
    startedAt:   new Date(createdAt.getTime() - duration * 1000),
    completedAt: createdAt,
    createdAt,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

const seed = async () => {
  await connectDB();

  console.log('[Seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    TypingSession.deleteMany({}),
    KeyPerformance.deleteMany({}),
    WordPerformance.deleteMany({}),
    AIAnalysis.deleteMany({}),
    Achievement.deleteMany({}),
  ]);

  console.log('[Seed] Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', env.bcryptRounds);

  const usersData = [
    {
      name:  'Alex Johnson',
      email: 'alex@typemind.dev',
      password: hashedPassword,
      avatar: '',
      stats: { totalTests: 145, totalWords: 12400, totalPracticeTime: 8700, bestWpm: 112, averageWpm: 95, averageAccuracy: 97.2, typingIQ: 108, currentStreak: 14, longestStreak: 30 },
      preferences: { leaderboardVisible: true },
    },
    {
      name:  'Sofia Martinez',
      email: 'sofia@typemind.dev',
      password: hashedPassword,
      stats: { totalTests: 89, totalWords: 7200, totalPracticeTime: 5400, bestWpm: 87, averageWpm: 72, averageAccuracy: 94.8, typingIQ: 92, currentStreak: 7, longestStreak: 21 },
      preferences: { leaderboardVisible: true },
    },
    {
      name:  'Ryan Chen',
      email: 'ryan@typemind.dev',
      password: hashedPassword,
      stats: { totalTests: 32, totalWords: 2100, totalPracticeTime: 1920, bestWpm: 55, averageWpm: 45, averageAccuracy: 91.0, typingIQ: 78, currentStreak: 3, longestStreak: 7 },
      preferences: { leaderboardVisible: false },
    },
    {
      name:  'Emma Wilson',
      email: 'emma@typemind.dev',
      password: hashedPassword,
      stats: { totalTests: 210, totalWords: 18500, totalPracticeTime: 12600, bestWpm: 135, averageWpm: 118, averageAccuracy: 98.5, typingIQ: 128, currentStreak: 45, longestStreak: 60 },
      preferences: { leaderboardVisible: true },
    },
    {
      name:  'Test User',
      email: 'test@typemind.dev',
      password: hashedPassword,
      stats: { totalTests: 5, totalWords: 350, totalPracticeTime: 300, bestWpm: 42, averageWpm: 38, averageAccuracy: 88.5, typingIQ: 65, currentStreak: 1, longestStreak: 2 },
      preferences: { leaderboardVisible: true },
    },
  ];

  const users = await User.insertMany(usersData);
  console.log(`[Seed] Created ${users.length} users.`);

  // Create typing sessions for each user
  console.log('[Seed] Creating typing sessions...');
  let totalSessions = 0;

  for (const user of users) {
    const sessionCount = user.stats.totalTests > 50 ? 25 : Math.min(user.stats.totalTests, 15);
    const sessions = [];

    for (let i = 0; i < sessionCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      sessions.push(
        generateSession(user._id, {
          wpm:        user.stats.averageWpm * (0.85 + Math.random() * 0.3),
          accuracy:   user.stats.averageAccuracy * (0.97 + Math.random() * 0.03),
          mode:       ['general', 'quotes', 'code'][Math.floor(Math.random() * 3)],
          difficulty: ['easy', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
          daysAgo,
        })
      );
    }

    await TypingSession.insertMany(sessions);
    totalSessions += sessions.length;

    // Create achievements
    const achievementData = [];
    if (user.stats.totalTests >= 1)   achievementData.push({ user: user._id, key: 'FIRST_TEST',      label: ACHIEVEMENTS.FIRST_TEST.label,      description: ACHIEVEMENTS.FIRST_TEST.desc });
    if (user.stats.bestWpm >= 50)     achievementData.push({ user: user._id, key: 'WPM_50',          label: ACHIEVEMENTS.WPM_50.label,          description: ACHIEVEMENTS.WPM_50.desc });
    if (user.stats.bestWpm >= 75)     achievementData.push({ user: user._id, key: 'WPM_75',          label: ACHIEVEMENTS.WPM_75.label,          description: ACHIEVEMENTS.WPM_75.desc });
    if (user.stats.bestWpm >= 100)    achievementData.push({ user: user._id, key: 'WPM_100',         label: ACHIEVEMENTS.WPM_100.label,         description: ACHIEVEMENTS.WPM_100.desc });
    if (user.stats.averageAccuracy >= 95) achievementData.push({ user: user._id, key: 'ACC_95', label: ACHIEVEMENTS.ACC_95.label, description: ACHIEVEMENTS.ACC_95.desc });
    if (user.stats.currentStreak >= 7)   achievementData.push({ user: user._id, key: 'STREAK_7', label: ACHIEVEMENTS.STREAK_7.label, description: ACHIEVEMENTS.STREAK_7.desc });
    if (user.stats.totalTests >= 100) achievementData.push({ user: user._id, key: 'TESTS_100',       label: ACHIEVEMENTS.TESTS_100.label,       description: ACHIEVEMENTS.TESTS_100.desc });

    if (achievementData.length > 0) {
      await Achievement.insertMany(achievementData, { ordered: false }).catch(() => {});
    }
  }

  console.log(`[Seed] Created ${totalSessions} typing sessions.`);
  console.log('[Seed] ✅ Database seeded successfully!');
  console.log('\n[Seed] Test credentials (all use password: Password123!):');
  for (const u of usersData) {
    console.log(`  ${u.email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed] Fatal error:', err.message);
  process.exit(1);
});
