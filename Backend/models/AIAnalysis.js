// models/AIAnalysis.js
// Stores AI-generated analysis linked to a user and typing session.

import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    typingSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TypingSession',
      required: true,
    },

    // Numeric quality score (0–100) computed deterministically by backend
    score: { type: Number, min: 0, max: 100, default: 0 },

    // AI-generated natural language content
    summary:         { type: String, maxlength: 1000, default: '' },
    strengths:       { type: [String], default: [] },
    weaknesses:      { type: [String], default: [] },
    recommendations: { type: [String], default: [] },

    // Keys/words/fingers AI recommends focusing on
    focusKeys:    { type: [String], default: [] },
    focusWords:   { type: [String], default: [] },
    focusFingers: { type: [String], default: [] },

    // Indicates whether AI call succeeded
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    error: { type: String, default: null }, // If AI call failed
  },
  {
    timestamps: true,
  }
);

aiAnalysisSchema.index({ user: 1, createdAt: -1 });
aiAnalysisSchema.index({ typingSession: 1 }, { unique: true });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
export default AIAnalysis;
