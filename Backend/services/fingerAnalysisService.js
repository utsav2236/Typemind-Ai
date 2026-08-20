// services/fingerAnalysisService.js
// Maps key performance data to fingers and identifies weak fingers.

import { getFingerForKey, ALL_FINGERS } from '../utils/keyMapping.js';
import { WEAK_FINGER } from '../utils/constants.js';

/**
 * Aggregate key performance stats per finger.
 *
 * @param {object} keyPerformance - Map of key → { attempts, correct, incorrect, accuracy, averageResponseTime }
 * @returns {object} fingerPerformance map — finger → { accuracy, averageResponseTime, attempts, correct, incorrect }
 */
export const analyzeFingerPerformance = (keyPerformance) => {
  // Initialize all fingers with zeroed accumulators
  const fingerAccumulators = {};
  for (const finger of ALL_FINGERS) {
    fingerAccumulators[finger] = {
      attempts:          0,
      correct:           0,
      incorrect:         0,
      totalResponseTime: 0,
    };
  }

  // Accumulate stats by finger
  for (const kp of Object.values(keyPerformance)) {
    const finger = getFingerForKey(kp.key);
    if (finger === 'unknown' || !fingerAccumulators[finger]) continue;

    fingerAccumulators[finger].attempts          += kp.attempts;
    fingerAccumulators[finger].correct           += kp.correct;
    fingerAccumulators[finger].incorrect         += kp.incorrect;
    fingerAccumulators[finger].totalResponseTime += kp.averageResponseTime * kp.attempts;
  }

  // Compute final stats
  const fingerPerformance = {};
  for (const [finger, acc] of Object.entries(fingerAccumulators)) {
    if (acc.attempts === 0) {
      // No data for this finger in this session
      fingerPerformance[finger] = {
        accuracy:            null,
        averageResponseTime: null,
        attempts:            0,
        correct:             0,
        incorrect:           0,
      };
      continue;
    }

    fingerPerformance[finger] = {
      accuracy:            Math.round((acc.correct / acc.attempts) * 100 * 100) / 100,
      averageResponseTime: Math.round(acc.totalResponseTime / acc.attempts),
      attempts:            acc.attempts,
      correct:             acc.correct,
      incorrect:           acc.incorrect,
    };
  }

  return fingerPerformance;
};

/**
 * Identify weak fingers from finger performance data.
 *
 * A finger is weak if:
 *  - accuracy < ACCURACY_THRESHOLD, OR
 *  - averageResponseTime > RESPONSE_TIME_THRESHOLD
 * and it has actual data (attempts > 0).
 *
 * @param {object} fingerPerformance - Output of analyzeFingerPerformance
 * @returns {Array<{finger, accuracy, averageResponseTime, attempts}>}
 */
export const getWeakFingers = (fingerPerformance) => {
  const weak = [];

  for (const [finger, fp] of Object.entries(fingerPerformance)) {
    if (fp.attempts === 0 || fp.accuracy === null) continue;

    const isLowAccuracy = fp.accuracy < WEAK_FINGER.ACCURACY_THRESHOLD;
    const isSlow        = fp.averageResponseTime > WEAK_FINGER.RESPONSE_TIME_THRESHOLD;

    if (isLowAccuracy || isSlow) {
      weak.push({
        finger,
        accuracy:            fp.accuracy,
        averageResponseTime: fp.averageResponseTime,
        attempts:            fp.attempts,
      });
    }
  }

  // Sort by accuracy ascending (worst finger first)
  weak.sort((a, b) => a.accuracy - b.accuracy);
  return weak;
};

/**
 * Merge a new session's finger performance into a historical aggregate.
 * Used to update cross-session KeyPerformance records.
 *
 * @param {object} existing - Existing historical finger performance
 * @param {object} newSession - New session's finger performance
 * @returns {object} Updated merged finger performance
 */
export const mergeFingerPerformance = (existing, newSession) => {
  const merged = { ...existing };

  for (const [finger, newFP] of Object.entries(newSession)) {
    if (newFP.attempts === 0) continue;

    if (!merged[finger] || merged[finger].attempts === 0) {
      merged[finger] = { ...newFP };
    } else {
      const existingFP = merged[finger];
      const totalAttempts = existingFP.attempts + newFP.attempts;
      const totalCorrect  = existingFP.correct  + newFP.correct;
      const totalRT       = (existingFP.averageResponseTime * existingFP.attempts) +
                            (newFP.averageResponseTime       * newFP.attempts);

      merged[finger] = {
        attempts:            totalAttempts,
        correct:             totalCorrect,
        incorrect:           existingFP.incorrect + newFP.incorrect,
        accuracy:            Math.round((totalCorrect / totalAttempts) * 100 * 100) / 100,
        averageResponseTime: Math.round(totalRT / totalAttempts),
      };
    }
  }

  return merged;
};
