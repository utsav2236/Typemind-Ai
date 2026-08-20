// services/adaptivePracticeService.js
// Determines adaptive difficulty and builds AI prompts for personalized practice content.
// All difficulty decisions are deterministic; AI is only used to generate natural text.

import { DIFFICULTY } from '../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE DIFFICULTY ENGINE & DURATION
// ─────────────────────────────────────────────────────────────────────────────

export const durationLimits = {
  15: { minWords: 10, maxWords: 30 },
  30: { minWords: 20, maxWords: 50 },
  60: { minWords: 40, maxWords: 100 },
  120: { minWords: 80, maxWords: 180 },
  300: { minWords: 200, maxWords: 450 }
};

export const calculateTargetWordCount = (duration, averageWpm = 40) => {
  const durationInMinutes = duration / 60;
  const effectiveWpm = averageWpm > 0 ? averageWpm : 40;
  const expectedWords = effectiveWpm * durationInMinutes;
  const buffer = expectedWords * 0.2;
  const calculatedWords = Math.ceil(expectedWords + buffer);

  const limits = durationLimits[duration] || { minWords: 10, maxWords: 500 };
  return Math.min(Math.max(calculatedWords, limits.minWords), limits.maxWords);
};

/**
 * Determine the next difficulty level based on recent sessions.
 *
 * Rules (applied to last LOOKBACK_SESSIONS sessions):
 *   avg accuracy >= 97% AND WPM improving → increase difficulty
 *   avg accuracy 90–96%                   → maintain difficulty
 *   avg accuracy 80–89%                   → slightly reduce
 *   avg accuracy < 80%                    → reduce difficulty
 *
 * @param {Array<{wpm:number, accuracy:number, difficulty:string}>} recentSessions
 * @param {string} [currentDifficulty='intermediate']
 * @returns {{ difficulty: string, reason: string }}
 */
export const getDifficultyAdjustment = (recentSessions, currentDifficulty = 'intermediate') => {
  const LEVELS = DIFFICULTY.LEVELS;
  const currentIndex = LEVELS.indexOf(currentDifficulty);
  const clampedIndex = currentIndex === -1 ? 2 : currentIndex; // default to intermediate

  if (!recentSessions || recentSessions.length === 0) {
    return { difficulty: currentDifficulty, reason: 'No session history — using current difficulty.' };
  }

  const sessions = recentSessions.slice(-DIFFICULTY.LOOKBACK_SESSIONS);
  const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;

  // WPM improvement: compare first half vs second half of lookback window
  const midPoint = Math.floor(sessions.length / 2);
  const firstHalfWpm = sessions.slice(0, midPoint).reduce((sum, s) => sum + s.wpm, 0) / (midPoint || 1);
  const secondHalfWpm = sessions.slice(midPoint).reduce((sum, s) => sum + s.wpm, 0) / (sessions.length - midPoint || 1);
  const wpmImproving = secondHalfWpm > firstHalfWpm * (1 + DIFFICULTY.INCREASE_AT_WPM_IMPROVEMENT / 100);

  let newIndex = clampedIndex;
  let reason;

  if (avgAccuracy >= DIFFICULTY.INCREASE_AT_ACCURACY && wpmImproving) {
    newIndex = Math.min(LEVELS.length - 1, clampedIndex + 1);
    reason = `Accuracy ${avgAccuracy.toFixed(1)}% + WPM improving → increasing difficulty.`;
  } else if (avgAccuracy >= DIFFICULTY.MAINTAIN_MIN && avgAccuracy <= DIFFICULTY.MAINTAIN_MAX) {
    reason = `Accuracy ${avgAccuracy.toFixed(1)}% → maintaining difficulty.`;
  } else if (avgAccuracy >= DIFFICULTY.REDUCE_MIN && avgAccuracy < DIFFICULTY.MAINTAIN_MIN) {
    newIndex = Math.max(0, clampedIndex - 1);
    reason = `Accuracy ${avgAccuracy.toFixed(1)}% → slightly reducing difficulty.`;
  } else if (avgAccuracy < DIFFICULTY.REDUCE_HARD_BELOW) {
    newIndex = Math.max(0, clampedIndex - 2);
    reason = `Accuracy ${avgAccuracy.toFixed(1)}% is low → reducing difficulty.`;
  } else {
    reason = `Accuracy ${avgAccuracy.toFixed(1)}% → no change.`;
  }

  return { difficulty: LEVELS[newIndex], reason };
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPROVEMENT TRACKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze whether a specific key is improving, stable, or declining across sessions.
 *
 * @param {string} key
 * @param {Array<object>} sessions - Recent sessions (chronological order)
 * @returns {{ trend: 'improving'|'stable'|'declining', delta: number }}
 */
export const analyzeKeyTrend = (key, sessions) => {
  const sessionAccuracies = sessions
    .filter((s) => s.keyPerformance && s.keyPerformance[key])
    .map((s) => s.keyPerformance[key].accuracy);

  if (sessionAccuracies.length < 2) {
    return { trend: 'stable', delta: 0 };
  }

  const first  = sessionAccuracies[0];
  const last   = sessionAccuracies[sessionAccuracies.length - 1];
  const delta  = last - first;

  let trend;
  if (delta > 5) {
    trend = 'improving';
  } else if (delta < -5) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return { trend, delta: Math.round(delta * 100) / 100 };
};

/**
 * Get prioritized weak keys, deprioritizing keys that are clearly improving.
 *
 * @param {Array<{key:string, accuracy:number, attempts:number}>} weakKeys
 * @param {Array<object>} recentSessions
 * @returns {Array<string>} Sorted key names
 */
export const getPrioritizedWeakKeys = (weakKeys, recentSessions) => {
  return weakKeys
    .map((wk) => {
      const { trend } = analyzeKeyTrend(wk.key, recentSessions);
      // Improving keys get lower priority score (push them down the list)
      const priorityPenalty = trend === 'improving' ? 20 : 0;
      return { ...wk, priority: (100 - wk.accuracy) - priorityPenalty };
    })
    .sort((a, b) => b.priority - a.priority)
    .map((wk) => wk.key);
};

// ─────────────────────────────────────────────────────────────────────────────
// AI PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a structured AI prompt for generating adaptive practice text.
 *
 * @param {{
 *   duration: number,
 *   targetWordCount: number,
 *   averageWpm: number,
 *   weakKeys: string[],
 *   weakWords: string[],
 *   weakFingers: string[],
 *   difficulty: string,
 *   mode: string,
 *   generationSeed: string
 * }} params
 * @returns {string} The system + user prompt
 */
export const buildAdaptivePrompt = ({
  duration,
  targetWordCount,
  averageWpm,
  weakKeys,
  weakWords,
  weakFingers,
  difficulty,
  mode,
  generationSeed
}) => {
  const weakKeyList    = weakKeys.slice(0, 6).join(', ')    || 'none identified';
  const weakWordList   = weakWords.slice(0, 5).join(', ')   || 'none identified';
  const weakFingerList = weakFingers.slice(0, 3).join(', ') || 'none identified';

  // Content complexity logic based on duration
  let contentStyle = 'normal paragraph, varied sentence lengths, moderate punctuation';
  if (duration <= 15) {
    contentStyle = 'short sentences, simple vocabulary, highly readable text';
  } else if (duration <= 30) {
    contentStyle = 'short-medium sentences, moderate vocabulary';
  } else if (duration <= 60) {
    contentStyle = 'normal paragraph, varied sentence lengths, moderate punctuation';
  } else if (duration <= 120) {
    contentStyle = 'multiple sentences, more varied vocabulary, slightly more complex ideas';
  } else if (duration >= 300) {
    contentStyle = 'multiple paragraphs or a long continuous passage, richer vocabulary, varied sentence structures, natural punctuation';
  }

  // Override style if specific mode is chosen (like code)
  if (mode === 'code') contentStyle = 'technical and programming terminology';

  return `You are generating a typing practice passage for TypeMind AI.

TEST DURATION:
${duration} seconds

TARGET WORD COUNT:
${targetWordCount} words

USER AVERAGE WPM:
${averageWpm || 40}

DIFFICULTY:
${difficulty}

CONTENT STYLE:
${contentStyle}

WEAK CHARACTERS:
${weakKeyList}

WEAK WORDS:
${weakWordList}

WEAK FINGERS:
${weakFingerList}

GENERATION ID:
${generationSeed || Date.now()}

Generate ONE original typing passage.

STRICT REQUIREMENTS:

1. Generate approximately ${targetWordCount} words.
2. Keep the passage appropriate for a ${duration} second typing test.
3. Do not generate significantly shorter content.
4. Do not generate significantly longer content.
5. Use natural sentences.
6. Maintain readable and meaningful content.
7. Naturally include the user's weak characters.
8. Include weak words when appropriate.
9. Target the user's weak fingers naturally.
10. Do not artificially repeat weak characters.
11. Do not copy previous passages.
12. Do not paraphrase previous passages.
13. Use fresh vocabulary and sentence structures.
14. Avoid generic AI introductions.
15. Return ONLY the typing passage.
16. Do not return markdown.
17. Do not return a title.
18. Do not return explanations.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT DEDUPLICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the new practice text is too similar to recently used practice texts.
 * Uses a simple character-level similarity check.
 *
 * @param {string} newText
 * @param {string[]} recentTexts - Recently generated practice texts
 * @param {number} [threshold=0.7] - Similarity threshold (0–1)
 * @returns {boolean} true if too similar (should regenerate)
 */
export const isTooSimilar = (newText, recentTexts, threshold = 0.7) => {
  if (!recentTexts || recentTexts.length === 0) return false;

  const newWords = new Set(newText.toLowerCase().split(/\s+/));

  for (const recent of recentTexts) {
    const recentWords = new Set(recent.toLowerCase().split(/\s+/));
    const intersection = [...newWords].filter((w) => recentWords.has(w)).length;
    const union = new Set([...newWords, ...recentWords]).size;
    const similarity = intersection / union;

    if (similarity > threshold) return true;
  }

  return false;
};
