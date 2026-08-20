// services/wordAnalysisService.js
// Analyzes word-level performance from keystroke data.

import { WEAK_WORD } from '../utils/constants.js';

/**
 * Analyze word-level performance from keystroke array and practice text.
 *
 * Strategy:
 * - Walk through the practice text word by word.
 * - For each word, find the keystrokes that correspond to it.
 * - Determine if the word was typed correctly and how long it took.
 *
 * @param {Array<{key:string, expectedKey:string, correct:boolean, responseTime:number}>} keystrokes
 * @param {string} text - The practice text
 * @returns {object} wordPerformance map — word → { attempts, correct, incorrect, accuracy, averageCompletionTime }
 */
export const analyzeWordPerformance = (keystrokes, text) => {
  const words = text.split(/\s+/).filter(Boolean);
  const wordPerformance = {};

  // Filter out backspace keystrokes for word analysis
  const typed = keystrokes.filter((k) => k.key !== 'Backspace');

  let ksIndex = 0;

  for (const word of words) {
    if (ksIndex >= typed.length) break;

    const wordLength = word.length;
    const wordKeystrokes = typed.slice(ksIndex, ksIndex + wordLength);

    if (wordKeystrokes.length === 0) break;

    // Determine if all characters in the word were correct
    const correctChars = wordKeystrokes.filter((k) => k.correct).length;
    const isWordCorrect = correctChars === wordLength && wordKeystrokes.length === wordLength;

    // Sum up response times for this word
    const completionTime = wordKeystrokes.reduce((sum, k) => sum + k.responseTime, 0);

    const normalizedWord = word.toLowerCase();

    if (!wordPerformance[normalizedWord]) {
      wordPerformance[normalizedWord] = {
        word:              normalizedWord,
        attempts:          0,
        correct:           0,
        incorrect:         0,
        accuracy:          0,
        totalCompletionTime:   0,
        averageCompletionTime: 0,
      };
    }

    const wp = wordPerformance[normalizedWord];
    wp.attempts++;
    if (isWordCorrect) {
      wp.correct++;
    } else {
      wp.incorrect++;
    }
    wp.totalCompletionTime += completionTime;

    // Move keystroke pointer forward (word + space)
    ksIndex += wordLength + 1; // +1 for the space keystroke
  }

  // Finalize accuracy and average completion time
  for (const wp of Object.values(wordPerformance)) {
    if (wp.attempts > 0) {
      wp.accuracy = Math.round((wp.correct / wp.attempts) * 100 * 100) / 100;
      wp.averageCompletionTime = Math.round(wp.totalCompletionTime / wp.attempts);
    }
    delete wp.totalCompletionTime;
  }

  return wordPerformance;
};

/**
 * Identify weak words from the word performance map.
 *
 * @param {object} wordPerformance - Output of analyzeWordPerformance
 * @param {object} [options]
 * @returns {Array<{word, accuracy, attempts, averageCompletionTime}>}
 */
export const getWeakWords = (wordPerformance, options = {}) => {
  const {
    minAttempts    = WEAK_WORD.MIN_ATTEMPTS,
    accuracyThresh = WEAK_WORD.ACCURACY_THRESHOLD,
    maxResults     = WEAK_WORD.MAX_RESULTS,
  } = options;

  const weakWords = [];

  for (const wp of Object.values(wordPerformance)) {
    if (wp.attempts < minAttempts) continue;
    if (wp.accuracy < accuracyThresh) {
      weakWords.push({
        word:                  wp.word,
        accuracy:              wp.accuracy,
        attempts:              wp.attempts,
        averageCompletionTime: wp.averageCompletionTime,
      });
    }
  }

  // Sort by accuracy ascending (worst word first)
  weakWords.sort((a, b) => a.accuracy - b.accuracy);
  return weakWords.slice(0, maxResults);
};

/**
 * Merge a new session's word performance into existing historical data.
 *
 * @param {Array} existingWords - Existing WordPerformance.words array
 * @param {object} newSession - New session's wordPerformance map
 * @returns {Array} Updated words array
 */
export const mergeWordPerformance = (existingWords, newSession) => {
  const merged = {};

  // Index existing words
  for (const wp of existingWords) {
    merged[wp.word] = { ...wp };
  }

  // Merge new session data
  for (const [word, newWP] of Object.entries(newSession)) {
    if (!merged[word]) {
      merged[word] = {
        word,
        attempts:          0,
        correct:           0,
        incorrect:         0,
        accuracy:          0,
        totalCompletionTime:   0,
        averageCompletionTime: 0,
        lastSeen:          new Date(),
      };
    }

    const existing = merged[word];
    const totalAttempts = existing.attempts + newWP.attempts;
    const totalCorrect  = existing.correct  + newWP.correct;

    // Rolling average for completion time
    const totalTime =
      (existing.averageCompletionTime * existing.attempts) +
      (newWP.averageCompletionTime    * newWP.attempts);

    merged[word] = {
      ...existing,
      attempts:              totalAttempts,
      correct:               totalCorrect,
      incorrect:             existing.incorrect + newWP.incorrect,
      accuracy:              Math.round((totalCorrect / totalAttempts) * 100 * 100) / 100,
      averageCompletionTime: Math.round(totalTime / totalAttempts),
      lastSeen:              new Date(),
    };
  }

  return Object.values(merged);
};
