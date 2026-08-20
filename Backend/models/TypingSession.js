// models/TypingSession.js
// Records a complete typing test with all computed performance metrics.

import mongoose from 'mongoose';

// ── Embedded sub-schemas ──────────────────────────────────────────────────────

const weakKeySchema = new mongoose.Schema(
  {
    key:                 { type: String, required: true },
    accuracy:            { type: Number, required: true },
    errorRate:           { type: Number, required: true },
    averageResponseTime: { type: Number, required: true },
    attempts:            { type: Number, required: true },
  },
  { _id: false }
);

const weakWordSchema = new mongoose.Schema(
  {
    word:                    { type: String, required: true },
    accuracy:                { type: Number, required: true },
    attempts:                { type: Number, required: true },
    averageCompletionTime:   { type: Number, required: true },
  },
  { _id: false }
);

const weakFingerSchema = new mongoose.Schema(
  {
    finger:              { type: String, required: true },
    accuracy:            { type: Number, required: true },
    averageResponseTime: { type: Number, required: true },
  },
  { _id: false }
);

// ── Main Schema ────────────────────────────────────────────────────────────────
const typingSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    mode: {
      type: String,
      enum: ['general', 'code', 'numbers', 'quotes', 'adaptive', 'custom'],
      default: 'general',
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'easy', 'intermediate', 'advanced', 'expert', 'adaptive'],
      default: 'intermediate',
    },

    duration: { type: Number, required: true }, // seconds

    // The text that was typed
    text: { type: String, required: true, maxlength: 5000 },

    // ── Server-calculated core metrics ──
    wpm:                { type: Number, required: true, min: 0 },
    rawWpm:             { type: Number, required: true, min: 0 },
    accuracy:           { type: Number, required: true, min: 0, max: 100 },
    consistency:        { type: Number, required: true, min: 0, max: 100 },

    // ── Character stats ──
    correctCharacters:  { type: Number, default: 0 },
    incorrectCharacters:{ type: Number, default: 0 },
    totalCharacters:    { type: Number, default: 0 },

    // ── Word stats ──
    totalWords:         { type: Number, default: 0 },
    completedWords:     { type: Number, default: 0 },

    // ── Error stats ──
    errorCount:         { type: Number, default: 0 },
    backspaces:         { type: Number, default: 0 },

    // ── Timing ──
    averageResponseTime: { type: Number, default: 0 }, // ms

    // ── Weak area arrays ──
    weakKeys:    { type: [weakKeySchema],    default: [] },
    weakWords:   { type: [weakWordSchema],   default: [] },
    weakFingers: { type: [weakFingerSchema], default: [] },

    // ── Full performance maps (stored as Mixed for flexibility) ──
    keyPerformance:    { type: mongoose.Schema.Types.Mixed, default: {} },
    fingerPerformance: { type: mongoose.Schema.Types.Mixed, default: {} },
    wordPerformance:   { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Typing IQ for this session ──
    typingIQ:   { type: Number, default: 0 },
    iqLevel:    { type: String, default: '' },

    // ── AI analysis reference ──
    aiAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAnalysis',
      default: null,
    },

    startedAt:   { type: Date, default: Date.now },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
typingSessionSchema.index({ user: 1, createdAt: -1 }); // User history queries
typingSessionSchema.index({ wpm: -1 });                 // Leaderboard-style sorts
typingSessionSchema.index({ user: 1, wpm: -1 });        // Personal bests

const TypingSession = mongoose.model('TypingSession', typingSessionSchema);
export default TypingSession;
