import { generateGuestPassage } from '../services/guestTypingService.js';
import { runFullAnalysis } from '../services/typingAnalysisService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';

const ALLOWED_DURATIONS = [30, 60, 180, 300];

/**
 * Start a guest typing test. Generates a fresh passage.
 */
export const startGuestTest = async (req, res, next) => {
  try {
    const { duration, sessionId } = req.body;

    if (!ALLOWED_DURATIONS.includes(duration)) {
      return errorResponse(res, 400, 'Invalid duration. Allowed durations are 30, 60, 180, and 300.');
    }

    if (!sessionId) {
      return errorResponse(res, 400, 'Guest session ID is required.');
    }

    const testId = crypto.randomUUID();

    const test = await generateGuestPassage(duration, sessionId, testId);

    return successResponse(res, 200, 'Guest test generated successfully.', { test });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit the result of a guest typing test to calculate WPM/Accuracy on the server side.
 */
export const submitGuestResult = async (req, res, next) => {
  try {
    const { testId, duration, keystrokes, text, timeTaken } = req.body;

    if (!testId || !duration || !keystrokes || !text) {
      return errorResponse(res, 400, 'Missing required test data.');
    }

    // Run deterministic analysis to calculate wpm and accuracy securely on backend
    const analysis = runFullAnalysis({ keystrokes, text, duration: timeTaken || duration });

    const result = {
      wpm: analysis.wpm,
      accuracy: analysis.accuracy,
      correctCharacters: analysis.correctCharacters,
      incorrectCharacters: analysis.incorrectCharacters,
      totalCharacters: analysis.totalCharacters,
      duration: timeTaken || duration,
    };

    return successResponse(res, 200, 'Guest result calculated.', { result });
  } catch (err) {
    next(err);
  }
};
