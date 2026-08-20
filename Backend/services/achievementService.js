// services/achievementService.js
// Deterministic achievement unlock logic.
// All checks use real backend data — never client values.

import Achievement from '../models/Achievement.js';
import { ACHIEVEMENTS } from '../utils/constants.js';

/**
 * Check and unlock any newly earned achievements for a user after a session.
 *
 * @param {object} user - Mongoose User document (with populated stats)
 * @param {object} session - Newly created TypingSession document
 * @param {object} previousStats - User stats BEFORE this session was applied
 * @returns {Promise<Array>} Array of newly unlocked achievement documents
 */
export const checkAndUnlockAchievements = async (user, session, previousStats = {}) => {
  const newAchievements = [];
  const A = ACHIEVEMENTS;

  // Fetch achievements the user already has (to avoid checking unlocked ones)
  const existing = await Achievement.find({ user: user._id }).select('key').lean();
  const unlockedKeys = new Set(existing.map((a) => a.key));

  const checks = [
    // ── Milestone: First test ─────────────────────────────────────────────
    {
      key: A.FIRST_TEST.key,
      condition: () => user.stats.totalTests >= 1,
      triggerValue: user.stats.totalTests,
    },

    // ── WPM milestones ────────────────────────────────────────────────────
    {
      key: A.WPM_50.key,
      condition: () => session.wpm >= 50,
      triggerValue: session.wpm,
    },
    {
      key: A.WPM_75.key,
      condition: () => session.wpm >= 75,
      triggerValue: session.wpm,
    },
    {
      key: A.WPM_100.key,
      condition: () => session.wpm >= 100,
      triggerValue: session.wpm,
    },
    {
      key: A.WPM_120.key,
      condition: () => session.wpm >= 120,
      triggerValue: session.wpm,
    },

    // ── Accuracy milestones ───────────────────────────────────────────────
    {
      key: A.ACC_95.key,
      condition: () => session.accuracy >= 95,
      triggerValue: session.accuracy,
    },
    {
      key: A.ACC_98.key,
      condition: () => session.accuracy >= 98,
      triggerValue: session.accuracy,
    },

    // ── Streak milestones ─────────────────────────────────────────────────
    {
      key: A.STREAK_7.key,
      condition: () => user.stats.currentStreak >= 7,
      triggerValue: user.stats.currentStreak,
    },
    {
      key: A.STREAK_30.key,
      condition: () => user.stats.currentStreak >= 30,
      triggerValue: user.stats.currentStreak,
    },

    // ── Volume milestone ──────────────────────────────────────────────────
    {
      key: A.TESTS_100.key,
      condition: () => user.stats.totalTests >= 100,
      triggerValue: user.stats.totalTests,
    },

    // ── Improvement milestone ─────────────────────────────────────────────
    {
      key: A.IMPROVED_20_WPM.key,
      condition: () => {
        const prevBest = previousStats.bestWpm || 0;
        return prevBest > 0 && session.wpm >= prevBest + 20;
      },
      triggerValue: session.wpm,
    },
  ];

  for (const check of checks) {
    // Skip already unlocked achievements
    if (unlockedKeys.has(check.key)) continue;

    if (check.condition()) {
      const meta = Object.values(ACHIEVEMENTS).find((a) => a.key === check.key);
      try {
        const achievement = await Achievement.create({
          user:          user._id,
          key:           check.key,
          label:         meta.label,
          description:   meta.desc,
          typingSession: session._id,
          triggerValue:  check.triggerValue,
          unlockedAt:    new Date(),
        });
        newAchievements.push(achievement);
      } catch (err) {
        // Duplicate key error means it was already created in a race condition — ignore
        if (err.code !== 11000) {
          console.error(`[Achievement] Error unlocking ${check.key}:`, err.message);
        }
      }
    }
  }

  return newAchievements;
};

/**
 * Update user streak based on today's session.
 *
 * Rules:
 * - First session of the day → increment streak
 * - Same day as last practice → no change (already counted)
 * - Gap > 1 day → reset streak to 1
 *
 * @param {object} user - Mongoose User document
 * @returns {{ currentStreak: number, longestStreak: number, streakUpdated: boolean }}
 */
export const updateStreak = (user) => {
  const now = new Date();
  const todayUTC = getUTCDateString(now);
  const lastPractice = user.stats.lastPracticeDate;

  let { currentStreak, longestStreak } = user.stats;
  let streakUpdated = false;

  if (!lastPractice) {
    // First ever session
    currentStreak = 1;
    streakUpdated = true;
  } else {
    const lastDateUTC = getUTCDateString(new Date(lastPractice));

    if (lastDateUTC === todayUTC) {
      // Already practiced today — no streak change
    } else {
      const yesterdayUTC = getUTCDateString(new Date(now.getTime() - 86400000));
      if (lastDateUTC === yesterdayUTC) {
        // Practiced yesterday → extend streak
        currentStreak++;
        streakUpdated = true;
      } else {
        // Gap of more than 1 day → reset
        currentStreak = 1;
        streakUpdated = true;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak, streakUpdated };
};

/**
 * Format a Date as a UTC date string: "YYYY-MM-DD"
 */
const getUTCDateString = (date) => {
  return date.toISOString().slice(0, 10);
};
