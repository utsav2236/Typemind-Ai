// controllers/typingController.js
// Handles the full typing session submission pipeline and history retrieval.

import TypingSession from '../models/TypingSession.js';
import KeyPerformance from '../models/KeyPerformance.js';
import WordPerformance from '../models/WordPerformance.js';
import AIAnalysis from '../models/AIAnalysis.js';
import User from '../models/User.js';

import { runFullAnalysis } from '../services/typingAnalysisService.js';
import { analyzeFingerPerformance, getWeakFingers, mergeFingerPerformance } from '../services/fingerAnalysisService.js';
import { analyzeWordPerformance, getWeakWords, mergeWordPerformance } from '../services/wordAnalysisService.js';
import { calculateTypingIQ, calculateImprovementPercent } from '../services/typingIQService.js';
import { checkAndUnlockAchievements, updateStreak } from '../services/achievementService.js';
import { analyzeTypingSession } from '../services/aiService.js';

import { successResponse, errorResponse } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT SESSION
// POST /api/typing/sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full typing session submission pipeline.
 * See architecture doc for the complete flow.
 */
export const submitSession = async (req, res, next) => {
  try {
    const { mode, difficulty, duration, text, keystrokes, startedAt, completedAt } = req.body;
    const user = req.user;

    // ── 1. Core typing analysis (deterministic) ───────────────────────────
    const analysis = runFullAnalysis({ keystrokes, text, duration });

    // ── 2. Finger analysis ────────────────────────────────────────────────
    const fingerPerformance = analyzeFingerPerformance(analysis.keyPerformance);
    const weakFingers        = getWeakFingers(fingerPerformance);

    // ── 3. Word analysis ──────────────────────────────────────────────────
    const wordPerformance = analyzeWordPerformance(keystrokes, text);
    const weakWords        = getWeakWords(wordPerformance);

    // ── 4. Typing IQ ──────────────────────────────────────────────────────
    const improvementPercent = calculateImprovementPercent(analysis.wpm, user.stats.averageWpm);
    const { typingIQ, level: iqLevel } = calculateTypingIQ(
      {
        wpm:                 analysis.wpm,
        accuracy:            analysis.accuracy,
        consistency:         analysis.consistency,
        errorRate:           analysis.incorrectCharacters > 0
          ? (analysis.incorrectCharacters / analysis.totalCharacters) * 100
          : 0,
        averageResponseTime: analysis.averageResponseTime,
      },
      improvementPercent
    );

    // ── 5. Capture previous stats for achievement checks ──────────────────
    const previousStats = {
      bestWpm:       user.stats.bestWpm,
      averageWpm:    user.stats.averageWpm,
      averageAccuracy: user.stats.averageAccuracy,
    };

    // ── 6. Save session ───────────────────────────────────────────────────
    const session = await TypingSession.create({
      user:                user._id,
      mode,
      difficulty,
      duration,
      text,
      wpm:                 analysis.wpm,
      rawWpm:              analysis.rawWpm,
      accuracy:            analysis.accuracy,
      consistency:         analysis.consistency,
      correctCharacters:   analysis.correctCharacters,
      incorrectCharacters: analysis.incorrectCharacters,
      totalCharacters:     analysis.totalCharacters,
      totalWords:          analysis.totalWords,
      completedWords:      analysis.completedWords,
      errorCount:          analysis.errors,
      backspaces:          analysis.backspaces,
      averageResponseTime: analysis.averageResponseTime,
      weakKeys:            analysis.weakKeys,
      weakWords,
      weakFingers,
      keyPerformance:      analysis.keyPerformance,
      fingerPerformance,
      wordPerformance,
      typingIQ,
      iqLevel,
      startedAt:           startedAt ? new Date(startedAt) : new Date(Date.now() - duration * 1000),
      completedAt:         completedAt ? new Date(completedAt) : new Date(),
    });

    // ── 7. Update cross-session key performance ───────────────────────────
    await updateCrossSessionKeyPerformance(user._id, analysis.keyPerformance);

    // ── 8. Update cross-session word performance ──────────────────────────
    await updateCrossSessionWordPerformance(user._id, wordPerformance);

    // ── 9. Update user stats ──────────────────────────────────────────────
    const { currentStreak, longestStreak } = updateStreak(user);
    const newTotalTests = user.stats.totalTests + 1;
    const newTotalWords = user.stats.totalWords + analysis.completedWords;
    const newTotalTime  = user.stats.totalPracticeTime + duration;
    const newBestWpm    = Math.max(user.stats.bestWpm, analysis.wpm);

    // Rolling average for WPM and accuracy
    const newAvgWpm = computeRollingAverage(user.stats.averageWpm, user.stats.totalTests, analysis.wpm);
    const newAvgAcc = computeRollingAverage(user.stats.averageAccuracy, user.stats.totalTests, analysis.accuracy);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'stats.totalTests':        newTotalTests,
        'stats.totalWords':        newTotalWords,
        'stats.totalPracticeTime': newTotalTime,
        'stats.bestWpm':           newBestWpm,
        'stats.averageWpm':        newAvgWpm,
        'stats.averageAccuracy':   newAvgAcc,
        'stats.typingIQ':          typingIQ,
        'stats.currentStreak':     currentStreak,
        'stats.longestStreak':     longestStreak,
        'stats.lastPracticeDate':  new Date(),
      },
    });

    // Reload user with updated stats for achievement checks
    const updatedUser = await User.findById(user._id).select('-password');

    // ── 10. Achievement checks ────────────────────────────────────────────
    const newAchievements = await checkAndUnlockAchievements(updatedUser, session, previousStats);

    // ── 11. Trigger AI analysis asynchronously (non-blocking) ─────────────
    triggerAsyncAIAnalysis(session, updatedUser);

    // ── 12. Return complete result ─────────────────────────────────────────
    return successResponse(res, 201, 'Session recorded successfully.', {
      session: {
        _id:                 session._id,
        wpm:                 session.wpm,
        rawWpm:              session.rawWpm,
        accuracy:            session.accuracy,
        consistency:         session.consistency,
        typingIQ,
        iqLevel,
        errors:              session.errorCount,
        backspaces:          session.backspaces,
        correctCharacters:   session.correctCharacters,
        incorrectCharacters: session.incorrectCharacters,
        totalCharacters:     session.totalCharacters,
        totalWords:          session.totalWords,
        completedWords:      session.completedWords,
        averageResponseTime: session.averageResponseTime,
        weakKeys:            session.weakKeys,
        weakWords:           session.weakWords,
        weakFingers:         session.weakFingers,
        keyPerformance:      session.keyPerformance,
        mode:                session.mode,
        difficulty:          session.difficulty,
        duration:            session.duration,
        createdAt:           session.createdAt,
      },
      userStats: {
        totalTests:      newTotalTests,
        bestWpm:         newBestWpm,
        averageWpm:      Math.round(newAvgWpm * 10) / 10,
        averageAccuracy: Math.round(newAvgAcc * 100) / 100,
        typingIQ,
        currentStreak,
        longestStreak,
      },
      newAchievements: newAchievements.map((a) => ({
        key:         a.key,
        label:       a.label,
        description: a.description,
        unlockedAt:  a.unlockedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SESSIONS (history)
// GET /api/typing/sessions
// ─────────────────────────────────────────────────────────────────────────────

export const getSessions = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      from, to, mode,
    } = req.query;

    const filter = { user: req.user._id };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (mode) filter.mode = mode;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      TypingSession.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-keyPerformance -fingerPerformance -wordPerformance -text')
        .lean(),
      TypingSession.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Sessions retrieved.', {
      sessions,
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE SESSION
// GET /api/typing/sessions/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getSessionById = async (req, res, next) => {
  try {
    const session = await TypingSession.findOne({
      _id:  req.params.id,
      user: req.user._id,
    }).populate('aiAnalysis', '-__v');

    if (!session) {
      return errorResponse(res, 404, 'Session not found.');
    }

    return successResponse(res, 200, 'Session retrieved.', { session });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rolling average: (oldAvg * oldCount + newValue) / (oldCount + 1)
 */
const computeRollingAverage = (oldAvg, oldCount, newValue) => {
  if (oldCount === 0) return newValue;
  return (oldAvg * oldCount + newValue) / (oldCount + 1);
};

/**
 * Update cross-session key performance (upsert).
 */
const updateCrossSessionKeyPerformance = async (userId, newKeyPerformance) => {
  try {
    const existing = await KeyPerformance.findOne({ user: userId });

    if (!existing) {
      const keys = Object.values(newKeyPerformance).map((kp) => ({
        ...kp,
        lastSeen: new Date(),
      }));
      await KeyPerformance.create({ user: userId, keys, sessionCount: 1 });
      return;
    }

    // Merge new key data into existing
    const keyMap = {};
    for (const k of existing.keys) {
      keyMap[k.key] = { ...k.toObject ? k.toObject() : k };
    }

    for (const newKP of Object.values(newKeyPerformance)) {
      if (!keyMap[newKP.key]) {
        keyMap[newKP.key] = { ...newKP, totalResponseTime: newKP.averageResponseTime * newKP.attempts, lastSeen: new Date() };
      } else {
        const ex = keyMap[newKP.key];
        const totalAttempts = ex.attempts + newKP.attempts;
        const totalCorrect  = ex.correct  + newKP.correct;
        const totalRT       = (ex.averageResponseTime * ex.attempts) + (newKP.averageResponseTime * newKP.attempts);

        keyMap[newKP.key] = {
          key:                 newKP.key,
          attempts:            totalAttempts,
          correct:             totalCorrect,
          incorrect:           ex.incorrect + newKP.incorrect,
          accuracy:            Math.round((totalCorrect / totalAttempts) * 100 * 100) / 100,
          errorRate:           Math.round(((ex.incorrect + newKP.incorrect) / totalAttempts) * 100 * 100) / 100,
          totalResponseTime:   totalRT,
          averageResponseTime: Math.round(totalRT / totalAttempts),
          lastSeen:            new Date(),
        };
      }
    }

    await KeyPerformance.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          keys:         Object.values(keyMap),
          lastUpdated:  new Date(),
          sessionCount: existing.sessionCount + 1,
        },
      }
    );
  } catch (err) {
    console.error('[KeyPerformance] Update error:', err.message);
  }
};

/**
 * Update cross-session word performance (upsert).
 */
const updateCrossSessionWordPerformance = async (userId, newWordPerformance) => {
  try {
    const existing = await WordPerformance.findOne({ user: userId });

    if (!existing) {
      const words = Object.values(newWordPerformance).map((wp) => ({
        ...wp,
        lastSeen: new Date(),
      }));
      await WordPerformance.create({ user: userId, words, sessionCount: 1 });
      return;
    }

    const merged = mergeWordPerformance(existing.words, newWordPerformance);

    await WordPerformance.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          words:        merged,
          lastUpdated:  new Date(),
          sessionCount: existing.sessionCount + 1,
        },
      }
    );
  } catch (err) {
    console.error('[WordPerformance] Update error:', err.message);
  }
};

/**
 * Fire-and-forget AI analysis — does not block the HTTP response.
 */
const triggerAsyncAIAnalysis = async (session, user) => {
  // Create a pending AIAnalysis placeholder
  let aiDoc;
  try {
    aiDoc = await AIAnalysis.create({
      user:          user._id,
      typingSession: session._id,
      status:        'pending',
    });

    // Link analysis to session
    await TypingSession.findByIdAndUpdate(session._id, { aiAnalysis: aiDoc._id });
  } catch (err) {
    console.error('[AI] Failed to create AIAnalysis placeholder:', err.message);
    return;
  }

  // Run the actual AI analysis asynchronously
  (async () => {
    try {
      const analysisData = await analyzeTypingSession(
        {
          wpm:                 session.wpm,
          rawWpm:              session.rawWpm,
          accuracy:            session.accuracy,
          consistency:         session.consistency,
          typingIQ:            session.typingIQ,
          weakKeys:            session.weakKeys,
          weakWords:           session.weakWords,
          weakFingers:         session.weakFingers,
          errors:              session.errorCount,
          averageResponseTime: session.averageResponseTime,
          mode:                session.mode,
          difficulty:          session.difficulty,
        },
        {
          previousWpm:      user.stats.averageWpm,
          previousAccuracy: user.stats.averageAccuracy,
          totalSessions:    user.stats.totalTests,
        }
      );

      await AIAnalysis.findByIdAndUpdate(aiDoc._id, {
        $set: {
          ...analysisData,
          score:  session.typingIQ,
          status: 'completed',
        },
      });
    } catch (err) {
      console.error('[AI] Analysis failed:', err.message);
      await AIAnalysis.findByIdAndUpdate(aiDoc._id, {
        $set: { status: 'failed', error: err.message },
      }).catch(() => {});
    }
  })();
};
