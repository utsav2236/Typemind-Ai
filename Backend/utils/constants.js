// utils/constants.js
// Central configuration constants for TypeMind AI backend.
// Adjust thresholds here to tune analysis behavior.

// ─── Weak Key Detection ─────────────────────────────────────────────────────
export const WEAK_KEY = {
  /** Minimum number of attempts before a key can be classified as weak */
  MIN_ATTEMPTS: 5,
  /** Accuracy below this threshold → weak (%) */
  ACCURACY_THRESHOLD: 85,
  /** Response time above this threshold → slow (ms) */
  RESPONSE_TIME_THRESHOLD: 300,
  /** Maximum number of weak keys to return */
  MAX_RESULTS: 10,
};

// ─── Weak Word Detection ─────────────────────────────────────────────────────
export const WEAK_WORD = {
  MIN_ATTEMPTS: 3,
  ACCURACY_THRESHOLD: 80,
  MAX_RESULTS: 10,
};

// ─── Weak Finger Detection ───────────────────────────────────────────────────
export const WEAK_FINGER = {
  ACCURACY_THRESHOLD: 85,
  RESPONSE_TIME_THRESHOLD: 280,
};

// ─── Adaptive Difficulty ─────────────────────────────────────────────────────
export const DIFFICULTY = {
  LEVELS: ['beginner', 'easy', 'intermediate', 'advanced', 'expert'],
  /** Number of recent sessions used for difficulty calculation */
  LOOKBACK_SESSIONS: 5,
  /** Accuracy >= this → increase difficulty */
  INCREASE_AT_ACCURACY: 97,
  /** WPM improvement required (% over lookback) to increase difficulty */
  INCREASE_AT_WPM_IMPROVEMENT: 5,
  /** Accuracy in this range → maintain difficulty */
  MAINTAIN_MIN: 90,
  MAINTAIN_MAX: 96,
  /** Accuracy in this range → slightly reduce */
  REDUCE_MIN: 80,
  REDUCE_MAX: 89,
  /** Accuracy below this → reduce difficulty */
  REDUCE_HARD_BELOW: 80,
};

// ─── Typing IQ ───────────────────────────────────────────────────────────────
export const TYPING_IQ = {
  /**
   * IQ Level bands:
   * 0–59   → Beginner
   * 60–74  → Elementary
   * 75–84  → Intermediate
   * 85–94  → Advanced
   * 95–109 → Expert
   * 110+   → Master
   */
  LEVELS: [
    { min: 0,   max: 59,  label: 'Beginner' },
    { min: 60,  max: 74,  label: 'Elementary' },
    { min: 75,  max: 84,  label: 'Intermediate' },
    { min: 85,  max: 94,  label: 'Advanced' },
    { min: 95,  max: 109, label: 'Expert' },
    { min: 110, max: Infinity, label: 'Master' },
  ],
  /** Weights for each factor — must sum to 1.0 */
  WEIGHTS: {
    wpm: 0.30,
    accuracy: 0.30,
    consistency: 0.15,
    errorRate: 0.10,
    responseTime: 0.10,
    improvement: 0.05,
  },
  /** WPM reference for 100-point normalization */
  WPM_REFERENCE: 120,
};

// ─── Consistency ─────────────────────────────────────────────────────────────
export const CONSISTENCY = {
  /** Number of equal time buckets to divide the test into */
  BUCKETS: 10,
  /** Minimum keystrokes needed to calculate meaningful consistency */
  MIN_KEYSTROKES: 20,
};

// ─── Session Validation ───────────────────────────────────────────────────────
export const SESSION_LIMITS = {
  MIN_DURATION: 15,        // seconds
  MAX_DURATION: 300,       // seconds
  MAX_TEXT_LENGTH: 5000,   // characters
  MAX_KEYSTROKES: 2000,    // items
  MAX_RESPONSE_TIME: 10000, // ms — anything over 10s is treated as a pause
  MIN_RESPONSE_TIME: 0,
};

// ─── Achievements ─────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = {
  FIRST_TEST:      { key: 'FIRST_TEST',      label: 'First Test',        desc: 'Complete your first typing test' },
  WPM_50:          { key: 'WPM_50',          label: 'Speed Demon',       desc: 'Reach 50 WPM' },
  WPM_75:          { key: 'WPM_75',          label: 'Swift Fingers',     desc: 'Reach 75 WPM' },
  WPM_100:         { key: 'WPM_100',         label: 'Century Typist',    desc: 'Reach 100 WPM' },
  WPM_120:         { key: 'WPM_120',         label: 'Keyboard Ninja',    desc: 'Reach 120 WPM' },
  ACC_95:          { key: 'ACC_95',          label: 'Precision',         desc: 'Achieve 95% accuracy' },
  ACC_98:          { key: 'ACC_98',          label: 'Perfectionist',     desc: 'Achieve 98% accuracy' },
  STREAK_7:        { key: 'STREAK_7',        label: 'Weekly Warrior',    desc: '7-day practice streak' },
  STREAK_30:       { key: 'STREAK_30',       label: 'Monthly Master',    desc: '30-day practice streak' },
  TESTS_100:       { key: 'TESTS_100',       label: 'Centurion',         desc: 'Complete 100 typing tests' },
  IMPROVED_20_WPM: { key: 'IMPROVED_20_WPM', label: 'Leveling Up',      desc: 'Improve WPM by 20 over time' },
};

// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  AUTH:    { windowMs: 15 * 60 * 1000, max: 10  },   // 10 req / 15 min
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },   // 100 req / 15 min
  AI:      { windowMs: 60 * 60 * 1000, max: 20  },   // 20 req / hour
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const LEADERBOARD = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const AI = {
  /** Maximum tokens for practice text generation */
  MAX_TOKENS_PRACTICE: 1500,
  /** Maximum tokens for analysis */
  MAX_TOKENS_ANALYSIS: 2000,
  /** Maximum characters in the prompt sent to AI */
  MAX_PROMPT_CHARS: 3000,
  /** Timeout for AI requests (ms) */
  TIMEOUT_MS: 30000,
};

// ─── Streak ───────────────────────────────────────────────────────────────────
export const STREAK = {
  /** Minimum valid test duration (seconds) to count toward a streak */
  MIN_VALID_DURATION: 15,
};
