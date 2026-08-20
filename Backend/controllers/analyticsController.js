// controllers/analyticsController.js
// Returns aggregated analytics data for dashboard charts and overview.

import TypingSession from '../models/TypingSession.js';
import KeyPerformance from '../models/KeyPerformance.js';
import WordPerformance from '../models/WordPerformance.js';
import { getWeakKeys } from '../services/typingAnalysisService.js';
import { getWeakFingers } from '../services/fingerAnalysisService.js';
import { getWeakWords } from '../services/wordAnalysisService.js';
import { successResponse } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW
// GET /api/analytics/overview
// ─────────────────────────────────────────────────────────────────────────────

export const getOverview = (req, res) => {
  const { stats } = req.user;
  return successResponse(res, 200, 'Overview retrieved.', {
    overview: {
      averageWpm:        Math.round(stats.averageWpm * 10) / 10,
      bestWpm:           stats.bestWpm,
      averageAccuracy:   Math.round(stats.averageAccuracy * 100) / 100,
      typingIQ:          stats.typingIQ,
      totalTests:        stats.totalTests,
      totalPracticeTime: stats.totalPracticeTime, // seconds
      currentStreak:     stats.currentStreak,
      longestStreak:     stats.longestStreak,
      totalWords:        stats.totalWords,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS (chart data)
// GET /api/analytics/progress
// ─────────────────────────────────────────────────────────────────────────────

export const getProgress = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    const sessions = await TypingSession.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select('wpm rawWpm accuracy consistency typingIQ iqLevel duration mode createdAt')
      .lean();

    // Calculate rolling averages for chart smoothing
    const progressData = sessions.map((s, index) => {
      const window = sessions.slice(Math.max(0, index - 4), index + 1);
      const avgWpm = window.reduce((sum, w) => sum + w.wpm, 0) / window.length;
      const avgAcc = window.reduce((sum, w) => sum + w.accuracy, 0) / window.length;

      return {
        date:          s.createdAt,
        wpm:           s.wpm,
        rawWpm:        s.rawWpm,
        accuracy:      s.accuracy,
        consistency:   s.consistency,
        typingIQ:      s.typingIQ,
        iqLevel:       s.iqLevel,
        mode:          s.mode,
        rollingAvgWpm: Math.round(avgWpm * 10) / 10,
        rollingAvgAcc: Math.round(avgAcc * 100) / 100,
      };
    });

    return successResponse(res, 200, 'Progress retrieved.', { progress: progressData });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// WEAKNESSES
// GET /api/analytics/weaknesses
// ─────────────────────────────────────────────────────────────────────────────

export const getWeaknesses = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Key weaknesses (from cross-session data) ──
    const keyPerfDoc = await KeyPerformance.findOne({ user: userId }).lean();
    let weakKeys = [];
    let keyPerformanceMap = {};

    if (keyPerfDoc && keyPerfDoc.keys) {
      for (const k of keyPerfDoc.keys) {
        keyPerformanceMap[k.key] = k;
      }
      weakKeys = getWeakKeys(keyPerformanceMap);
    }

    // ── Word weaknesses ──
    const wordPerfDoc = await WordPerformance.findOne({ user: userId }).lean();
    let weakWords = [];
    if (wordPerfDoc && wordPerfDoc.words) {
      const wordMap = {};
      for (const w of wordPerfDoc.words) wordMap[w.word] = w;
      weakWords = getWeakWords(wordMap);
    }

    // ── Finger weaknesses (computed from cross-session key data) ──
    let weakFingers = [];
    if (Object.keys(keyPerformanceMap).length > 0) {
      const { analyzeFingerPerformance } = await import('../services/fingerAnalysisService.js');
      const fingerPerf = analyzeFingerPerformance(keyPerformanceMap);
      weakFingers = getWeakFingers(fingerPerf);
    }

    // ── Recent trend for weak keys ──
    const recentSessions = await TypingSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('keyPerformance wpm accuracy createdAt')
      .lean();

    const { getPrioritizedWeakKeys } = await import('../services/adaptivePracticeService.js');
    const prioritizedWeakKeys = getPrioritizedWeakKeys(weakKeys, recentSessions);

    return successResponse(res, 200, 'Weaknesses retrieved.', {
      weakKeys,
      weakWords,
      weakFingers,
      prioritizedFocusKeys: prioritizedWeakKeys.slice(0, 5),
      dataSessions: recentSessions.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// KEY PERFORMANCE
// GET /api/analytics/key-performance
// ─────────────────────────────────────────────────────────────────────────────

export const getKeyPerformance = async (req, res, next) => {
  try {
    const keyPerfDoc = await KeyPerformance.findOne({ user: req.user._id }).lean();

    if (!keyPerfDoc) {
      return successResponse(res, 200, 'No key performance data yet.', {
        keyPerformance: [],
        sessionCount: 0,
      });
    }

    return successResponse(res, 200, 'Key performance retrieved.', {
      keyPerformance: keyPerfDoc.keys,
      sessionCount:   keyPerfDoc.sessionCount,
      lastUpdated:    keyPerfDoc.lastUpdated,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FINGER PERFORMANCE
// GET /api/analytics/finger-performance
// ─────────────────────────────────────────────────────────────────────────────

export const getFingerPerformance = async (req, res, next) => {
  try {
    const keyPerfDoc = await KeyPerformance.findOne({ user: req.user._id }).lean();

    if (!keyPerfDoc || !keyPerfDoc.keys?.length) {
      return successResponse(res, 200, 'No finger performance data yet.', {
        fingerPerformance: {},
        weakFingers: [],
      });
    }

    const keyPerformanceMap = {};
    for (const k of keyPerfDoc.keys) keyPerformanceMap[k.key] = k;

    const { analyzeFingerPerformance } = await import('../services/fingerAnalysisService.js');
    const fingerPerformance = analyzeFingerPerformance(keyPerformanceMap);
    const weakFingers        = getWeakFingers(fingerPerformance);

    return successResponse(res, 200, 'Finger performance retrieved.', {
      fingerPerformance,
      weakFingers,
    });
  } catch (err) {
    next(err);
  }
};
