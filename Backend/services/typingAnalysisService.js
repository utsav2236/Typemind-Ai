// services/typingAnalysisService.js
// Core deterministic typing analysis.
// ALL metrics are server-calculated; client-provided values are never trusted.

import { WEAK_KEY, CONSISTENCY, SESSION_LIMITS } from '../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// WPM CALCULATION
// Convention: 5 characters = 1 word
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate WPM from correct characters and elapsed time.
 * @param {number} correctChars
 * @param {number} durationSeconds
 * @returns {number} WPM (rounded to 1 decimal)
 */
export const calculateWPM = (correctChars, durationSeconds) => {
  if (durationSeconds <= 0 || correctChars < 0) return 0;
  const minutes = durationSeconds / 60;
  const words = correctChars / 5;
  return Math.trunc(words / minutes);
};

/**
 * Calculate Raw WPM — total keystrokes (correct + incorrect) / 5 / minutes.
 * @param {number} totalChars
 * @param {number} durationSeconds
 * @returns {number}
 */
export const calculateRawWPM = (totalChars, durationSeconds) => {
  if (durationSeconds <= 0 || totalChars < 0) return 0;
  const minutes = durationSeconds / 60;
  return Math.trunc(totalChars / 5 / minutes);
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCURACY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate accuracy percentage.
 * @param {number} correctChars
 * @param {number} totalChars  (all typed characters, including mistakes)
 * @returns {number} 0–100 (rounded to 2 decimal places)
 */
export const calculateAccuracy = (correctChars, totalChars) => {
  if (totalChars <= 0) return 0;
  const raw = (correctChars / totalChars) * 100;
  return Math.trunc(raw);
};

// ─────────────────────────────────────────────────────────────────────────────
// KEYSTROKE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes raw keystroke array to produce per-key performance stats.
 *
 * @param {Array<{key:string, expectedKey:string, correct:boolean, responseTime:number}>} keystrokes
 * @returns {{
 *   keyPerformance: object,
 *   correctCharacters: number,
 *   incorrectCharacters: number,
 *   totalCharacters: number,
 *   backspaces: number,
 *   averageResponseTime: number,
 * }}
 */
export const analyzeKeystrokes = (keystrokes) => {
  const keyPerformance = {};
  let correctCharacters = 0;
  let incorrectCharacters = 0;
  let backspaces = 0;
  let totalResponseTime = 0;
  let validResponseTimeCount = 0;

  for (const ks of keystrokes) {
    const { key, expectedKey, correct, responseTime } = ks;

    // Count backspaces separately — they don't count toward typing
    if (key === 'Backspace') {
      backspaces++;
      continue;
    }

    if (correct) {
      correctCharacters++;
    } else {
      incorrectCharacters++;
    }

    // ── Accumulate response time (cap extreme values) ──
    const clampedRT = Math.min(responseTime, SESSION_LIMITS.MAX_RESPONSE_TIME);
    if (clampedRT >= 0) {
      totalResponseTime += clampedRT;
      validResponseTimeCount++;
    }

    // ── Per-key stats ──
    // Use the EXPECTED key for classification (what should have been typed)
    const targetKey = expectedKey || key;
    if (!keyPerformance[targetKey]) {
      keyPerformance[targetKey] = {
        key: targetKey,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        errorRate: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
      };
    }

    const kp = keyPerformance[targetKey];
    kp.attempts++;
    if (correct) {
      kp.correct++;
    } else {
      kp.incorrect++;
    }
    kp.totalResponseTime += clampedRT;
  }

  // ── Finalize per-key stats ──
  for (const kp of Object.values(keyPerformance)) {
    if (kp.attempts > 0) {
      kp.accuracy = Math.round((kp.correct / kp.attempts) * 100 * 100) / 100;
      kp.errorRate = Math.round((kp.incorrect / kp.attempts) * 100 * 100) / 100;
      kp.averageResponseTime = Math.round(kp.totalResponseTime / kp.attempts);
    }
    // Remove internal rolling field before saving
    delete kp.totalResponseTime;
  }

  const totalCharacters = correctCharacters + incorrectCharacters;
  const averageResponseTime =
    validResponseTimeCount > 0
      ? Math.round(totalResponseTime / validResponseTimeCount)
      : 0;

  return {
    keyPerformance,
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    backspaces,
    averageResponseTime,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// WEAK KEY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identify weak keys from the key performance map.
 *
 * A key is considered weak when:
 *  - attempts >= MIN_ATTEMPTS (prevents noise from rare keys)
 *  - accuracy < ACCURACY_THRESHOLD
 *  OR
 *  - averageResponseTime > RESPONSE_TIME_THRESHOLD
 *
 * Keys are scored and sorted by weakness severity.
 *
 * @param {object} keyPerformance - Output of analyzeKeystrokes
 * @param {object} [options] - Override thresholds
 * @returns {Array<{key, accuracy, errorRate, averageResponseTime, attempts}>}
 */
export const getWeakKeys = (keyPerformance, options = {}) => {
  const {
    minAttempts    = WEAK_KEY.MIN_ATTEMPTS,
    accuracyThresh = WEAK_KEY.ACCURACY_THRESHOLD,
    responseThresh = WEAK_KEY.RESPONSE_TIME_THRESHOLD,
    maxResults     = WEAK_KEY.MAX_RESULTS,
  } = options;

  const weakKeys = [];

  for (const kp of Object.values(keyPerformance)) {
    if (kp.attempts < minAttempts) continue;

    const isLowAccuracy = kp.accuracy < accuracyThresh;
    const isSlow        = kp.averageResponseTime > responseThresh;

    if (isLowAccuracy || isSlow) {
      // Weakness score: weighted combination of accuracy deficit and slowness
      const accuracyDeficit  = Math.max(0, accuracyThresh - kp.accuracy);
      const responseOverhead = Math.max(0, kp.averageResponseTime - responseThresh);
      const weaknessScore    = accuracyDeficit * 1.5 + responseOverhead * 0.1;

      weakKeys.push({
        key:                 kp.key,
        accuracy:            kp.accuracy,
        errorRate:           kp.errorRate,
        averageResponseTime: kp.averageResponseTime,
        attempts:            kp.attempts,
        _weaknessScore:      weaknessScore,
      });
    }
  }

  // Sort by weakness score descending (most weak first)
  weakKeys.sort((a, b) => b._weaknessScore - a._weaknessScore);

  // Remove internal score before returning
  return weakKeys.slice(0, maxResults).map(({ _weaknessScore, ...rest }) => rest);
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate typing consistency score (0–100).
 *
 * Method:
 * 1. Divide keystrokes into equal time buckets.
 * 2. Calculate WPM for each bucket.
 * 3. Compute coefficient of variation (CV = stddev / mean).
 * 4. Convert to a 0–100 score: higher consistency = lower variation.
 *
 * @param {Array<{responseTime:number, correct:boolean, key:string}>} keystrokes
 * @param {number} durationSeconds
 * @returns {number} 0–100 consistency score
 */
export const calculateConsistency = (keystrokes, durationSeconds) => {
  // Filter out backspaces for consistency calculation
  const typedKeys = keystrokes.filter((k) => k.key !== 'Backspace');

  if (typedKeys.length < CONSISTENCY.MIN_KEYSTROKES) {
    // Not enough data — return neutral score
    return 70;
  }

  const bucketCount  = CONSISTENCY.BUCKETS;
  const bucketSize   = Math.floor(typedKeys.length / bucketCount);

  if (bucketSize < 2) return 70;

  const bucketDuration = durationSeconds / bucketCount; // seconds per bucket
  const bucketWPMs     = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucket = typedKeys.slice(i * bucketSize, (i + 1) * bucketSize);
    const correctInBucket = bucket.filter((k) => k.correct).length;
    const wpmInBucket = calculateWPM(correctInBucket, bucketDuration);
    bucketWPMs.push(wpmInBucket);
  }

  // Statistical variation
  const mean   = bucketWPMs.reduce((a, b) => a + b, 0) / bucketWPMs.length;
  if (mean === 0) return 0;

  const variance = bucketWPMs.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / bucketWPMs.length;
  const stddev   = Math.sqrt(variance);
  const cv       = stddev / mean; // coefficient of variation (0 = perfect consistency)

  // Map CV to 0–100: CV of 0 → 100, CV of 0.5+ → ~0
  const consistency = Math.round(Math.max(0, Math.min(100, (1 - cv * 2) * 100)));
  return consistency;
};

// ─────────────────────────────────────────────────────────────────────────────
// WORD COUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count how many words were fully typed in the practice text.
 * @param {string} text
 * @param {number} correctChars
 * @returns {{ totalWords: number, completedWords: number }}
 */
export const countWords = (text, correctChars) => {
  const words    = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Estimate completed words by seeing how far into the text correct chars reach
  let charCount = 0;
  let completedWords = 0;
  for (const word of words) {
    charCount += word.length + 1; // +1 for space
    if (charCount <= correctChars + 1) {
      completedWords++;
    } else {
      break;
    }
  }

  return { totalWords, completedWords };
};

// ─────────────────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count distinct error events (consecutive mistakes on same key = 1 error).
 * @param {Array<{correct:boolean, key:string}>} keystrokes
 * @returns {number}
 */
export const countErrors = (keystrokes) => {
  let errors = 0;
  let prevWasError = false;
  for (const ks of keystrokes) {
    if (ks.key === 'Backspace') continue;
    if (!ks.correct) {
      if (!prevWasError) errors++;
      prevWasError = true;
    } else {
      prevWasError = false;
    }
  }
  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL ANALYSIS PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the complete typing analysis pipeline.
 *
 * @param {{
 *   keystrokes: Array,
 *   text: string,
 *   duration: number
 * }} input
 * @returns {object} Full analysis result
 */
export const runFullAnalysis = (input) => {
  const { keystrokes, text, duration } = input;

  const {
    keyPerformance,
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    backspaces,
    averageResponseTime,
  } = analyzeKeystrokes(keystrokes);

  const wpm         = calculateWPM(correctCharacters, duration);
  const rawWpm      = calculateRawWPM(totalCharacters, duration);
  const accuracy    = calculateAccuracy(correctCharacters, totalCharacters);
  const consistency = calculateConsistency(keystrokes, duration);
  const errors      = countErrors(keystrokes);
  const { totalWords, completedWords } = countWords(text, correctCharacters);
  const weakKeys    = getWeakKeys(keyPerformance);

  return {
    wpm,
    rawWpm,
    accuracy,
    consistency,
    errors,
    backspaces,
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    totalWords,
    completedWords,
    averageResponseTime,
    keyPerformance,
    weakKeys,
  };
};
