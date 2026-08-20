// services/typingIQService.js
// Deterministic Typing IQ score calculation.
//
// Formula (documented):
// ─────────────────────────────────────────────────────────────────────────────
// The Typing IQ is a weighted composite score scaled to 0–150, analogous to
// an intelligence quotient score where 100 = solid average performance.
//
// Components and weights (must sum to 1.0):
//   wpm          × 0.30   — normalized against 120 WPM reference
//   accuracy     × 0.30   — 100% accuracy = 100 points
//   consistency  × 0.15   — 0–100 scale
//   errorRate    × 0.10   — inverted: 0% errors = 100, 100% = 0
//   responseTime × 0.10   — normalized against 150ms reference
//   improvement  × 0.05   — recent trend improvement bonus
//
// The weighted sum produces a 0–100 base score.
// This is then scaled to the 0–150 IQ scale using a soft exponential curve
// to preserve a natural distribution around 100.
// ─────────────────────────────────────────────────────────────────────────────

import { TYPING_IQ } from '../utils/constants.js';

/**
 * Calculate the Typing IQ for a single session.
 *
 * @param {{
 *   wpm: number,
 *   accuracy: number,      // 0–100
 *   consistency: number,   // 0–100
 *   errorRate: number,     // 0–100 (percentage of incorrect keystrokes)
 *   averageResponseTime: number, // ms
 * }} sessionData
 * @param {number} [improvementPercent=0] - % WPM improvement vs. previous session
 * @returns {{ typingIQ: number, level: string, breakdown: object }}
 */
export const calculateTypingIQ = (sessionData, improvementPercent = 0) => {
  const { wpm, accuracy, consistency, errorRate, averageResponseTime } = sessionData;
  const W = TYPING_IQ.WEIGHTS;

  // ── 1. Normalize each component to 0–100 ──────────────────────────────────

  // WPM: 0 → 0, 120 → 100, >120 → can exceed 100 slightly (capped at 120)
  const wpmScore = Math.min(120, (wpm / TYPING_IQ.WPM_REFERENCE) * 100);

  // Accuracy: already 0–100
  const accuracyScore = Math.min(100, accuracy);

  // Consistency: already 0–100
  const consistencyScore = Math.min(100, consistency);

  // Error rate: inverted (0% errors = 100 points, 20%+ errors = ~0)
  const errorScore = Math.max(0, 100 - errorRate * 5);

  // Response time: 50ms → 100, 150ms → 83, 300ms → 50, 600ms+ → ~0
  // Formula: 100 * (150 / responseTime) capped at 100
  const rtScore = averageResponseTime > 0
    ? Math.min(100, (150 / averageResponseTime) * 100)
    : 50; // Unknown → neutral

  // Improvement: +5% WPM improvement → 100 points, diminishing for larger improvements
  const improvementScore = Math.min(100, Math.max(0, improvementPercent * 20));

  // ── 2. Weighted composite score (0–100) ───────────────────────────────────
  const compositeScore =
    wpmScore          * W.wpm          +
    accuracyScore     * W.accuracy     +
    consistencyScore  * W.consistency  +
    errorScore        * W.errorRate    +
    rtScore           * W.responseTime +
    improvementScore  * W.improvement;

  // ── 3. Scale to IQ range (0–150) ──────────────────────────────────────────
  // Uses a soft S-curve: median composite (50) maps to IQ 100
  // This gives a natural bell-curve distribution around 100
  const typingIQ = Math.round(scaleToIQ(compositeScore));

  // ── 4. Determine level ────────────────────────────────────────────────────
  const level = getIQLevel(typingIQ);

  return {
    typingIQ,
    level,
    breakdown: {
      wpmScore:          Math.round(wpmScore),
      accuracyScore:     Math.round(accuracyScore),
      consistencyScore:  Math.round(consistencyScore),
      errorScore:        Math.round(errorScore),
      rtScore:           Math.round(rtScore),
      improvementScore:  Math.round(improvementScore),
      compositeScore:    Math.round(compositeScore * 100) / 100,
    },
  };
};

/**
 * Scale composite 0–100 score to IQ 0–150 range.
 * Uses a piecewise linear mapping:
 *   composite 0  → IQ 0
 *   composite 50 → IQ 100  (average composite = average IQ)
 *   composite 80 → IQ 125
 *   composite 100 → IQ 150
 */
const scaleToIQ = (composite) => {
  if (composite <= 0)   return 0;
  if (composite >= 100) return 150;

  if (composite <= 50) {
    // 0–50 composite → 0–100 IQ (linear)
    return composite * 2;
  } else if (composite <= 80) {
    // 50–80 composite → 100–125 IQ
    return 100 + ((composite - 50) / 30) * 25;
  } else {
    // 80–100 composite → 125–150 IQ
    return 125 + ((composite - 80) / 20) * 25;
  }
};

/**
 * Return the IQ level label for a given score.
 * @param {number} iq
 * @returns {string}
 */
export const getIQLevel = (iq) => {
  for (const band of TYPING_IQ.LEVELS) {
    if (iq >= band.min && iq <= band.max) {
      return band.label;
    }
  }
  return 'Unknown';
};

/**
 * Calculate WPM improvement percentage compared to previous average.
 * @param {number} currentWpm
 * @param {number} previousAverageWpm
 * @returns {number} Percentage improvement (can be negative)
 */
export const calculateImprovementPercent = (currentWpm, previousAverageWpm) => {
  if (previousAverageWpm <= 0) return 0;
  return ((currentWpm - previousAverageWpm) / previousAverageWpm) * 100;
};
