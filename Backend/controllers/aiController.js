// controllers/aiController.js
// AI-powered practice text generation and analysis retrieval.

import AIAnalysis from '../models/AIAnalysis.js';
import TypingSession from '../models/TypingSession.js';
import KeyPerformance from '../models/KeyPerformance.js';
import WordPerformance from '../models/WordPerformance.js';

import { generatePracticeText } from '../services/aiService.js';
import { getWeakKeys } from '../services/typingAnalysisService.js';
import { getWeakFingers, analyzeFingerPerformance } from '../services/fingerAnalysisService.js';
import { getWeakWords } from '../services/wordAnalysisService.js';
import {
  getDifficultyAdjustment,
  buildAdaptivePrompt,
  getPrioritizedWeakKeys,
  isTooSimilar,
  calculateTargetWordCount,
} from '../services/adaptivePracticeService.js';

import { successResponse, errorResponse } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PRACTICE TEXT
// POST /api/ai/generate-practice
// ─────────────────────────────────────────────────────────────────────────────

export const generatePractice = async (req, res, next) => {
  try {
    const { duration = 60, difficulty = 'adaptive', mode = 'general' } = req.body;
    const userId = req.user._id;

    // ── 1. Fetch recent session history ───────────────────────────────────
    const recentSessions = await TypingSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('wpm accuracy difficulty mode keyPerformance createdAt')
      .lean();

    // ── 2. Get cross-session weakness data ────────────────────────────────
    const keyPerfDoc  = await KeyPerformance.findOne({ user: userId }).lean();
    const wordPerfDoc = await WordPerformance.findOne({ user: userId }).lean();

    let weakKeys    = [];
    let weakWords   = [];
    let weakFingers = [];
    let keyPerfMap  = {};

    if (keyPerfDoc?.keys?.length) {
      for (const k of keyPerfDoc.keys) keyPerfMap[k.key] = k;
      const rawWeakKeys = getWeakKeys(keyPerfMap);
      weakKeys = getPrioritizedWeakKeys(rawWeakKeys, recentSessions);
    }

    if (wordPerfDoc?.words?.length) {
      const wordMap = {};
      for (const w of wordPerfDoc.words) wordMap[w.word] = w;
      weakWords = getWeakWords(wordMap).map((w) => w.word);
    }

    if (Object.keys(keyPerfMap).length > 0) {
      const fingerPerf = analyzeFingerPerformance(keyPerfMap);
      weakFingers = getWeakFingers(fingerPerf).map((f) => f.finger);
    }

    // ── 3. Determine difficulty ────────────────────────────────────────────
    let resolvedDifficulty = difficulty;
    if (difficulty === 'adaptive') {
      const { difficulty: adjusted } = getDifficultyAdjustment(
        recentSessions,
        recentSessions[0]?.difficulty || 'intermediate'
      );
      resolvedDifficulty = adjusted;
    }

    // ── 4. Calculate target word count ──────────────────────────────────────
    const currentWpm = req.user.stats?.averageWpm || 40;
    const targetWordCount = calculateTargetWordCount(duration, currentWpm);
    const tolerance = 0.15;
    const minWords = Math.floor(targetWordCount * (1 - tolerance));
    const maxWords = Math.ceil(targetWordCount * (1 + tolerance));

    // ── 5. Check recent AI-generated texts for deduplication ──────────────
    const recentAIAnalyses = await AIAnalysis.find({
      user:   userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('typingSession', 'text')
      .lean();

    const recentTexts = recentAIAnalyses
      .map((a) => a.typingSession?.text)
      .filter(Boolean);

    // ── 6. Build adaptive prompt and generate ─────────────────────────────
    const prompt = buildAdaptivePrompt({
      duration,
      targetWordCount,
      averageWpm: currentWpm,
      weakKeys,
      weakWords,
      weakFingers,
      difficulty: resolvedDifficulty,
      mode,
      generationSeed: Date.now().toString() + Math.random(),
    });

    let practiceText = await generatePracticeText(prompt);
    
    // In case the AI returns something too long, we can trim it to maxWords
    let words = practiceText.trim().split(/\s+/);
    if (words.length > maxWords) {
      words = words.slice(0, maxWords);
      practiceText = words.join(' ');
    }
    
    const actualWordCount = words.length;

    return successResponse(res, 200, 'Practice text generated.', {
      practice: {
        text:             practiceText,
        difficulty:       resolvedDifficulty,
        mode,
        duration,
        targetWordCount,
        actualWordCount,
        focusKeys:        weakKeys.slice(0, 5),
        focusWords:       weakWords.slice(0, 5),
        focusFingers:     weakFingers.slice(0, 3),
      },
    });
  } catch (err) {
    // If AI fails, return a graceful error (don't crash)
    if (err.message?.includes('AI_API_KEY')) {
      return errorResponse(res, 503, 'AI service not configured. Please add AI_API_KEY to your environment.');
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET AI ANALYSIS FOR A SESSION
// GET /api/ai/analysis/:sessionId
// ─────────────────────────────────────────────────────────────────────────────

export const getAIAnalysis = async (req, res, next) => {
  try {
    // Ensure the session belongs to the requesting user
    const session = await TypingSession.findOne({
      _id:  req.params.sessionId,
      user: req.user._id,
    }).select('_id aiAnalysis');

    if (!session) {
      return errorResponse(res, 404, 'Session not found.');
    }

    if (!session.aiAnalysis) {
      return successResponse(res, 200, 'AI analysis not yet available for this session.', {
        analysis: null,
        status:   'not_started',
      });
    }

    const analysis = await AIAnalysis.findById(session.aiAnalysis).lean();

    return successResponse(res, 200, 'AI analysis retrieved.', { analysis });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RECENT AI ANALYSES
// GET /api/ai/analyses
// ─────────────────────────────────────────────────────────────────────────────

export const getRecentAnalyses = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const analyses = await AIAnalysis.find({
      user:   req.user._id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(res, 200, 'Recent analyses retrieved.', { analyses });
  } catch (err) {
    next(err);
  }
};
