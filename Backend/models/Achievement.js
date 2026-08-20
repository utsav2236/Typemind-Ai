// models/Achievement.js
// Records individual achievement unlocks per user.
// Each document represents a single achievement earned by a user.

import mongoose from 'mongoose';
import { ACHIEVEMENTS } from '../utils/constants.js';

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Achievement key — must match one of the ACHIEVEMENTS constants
    key: {
      type: String,
      required: true,
      enum: Object.keys(ACHIEVEMENTS),
    },

    label: { type: String, required: true },
    description: { type: String, default: '' },

    // The session that triggered this unlock (optional)
    typingSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TypingSession',
      default: null,
    },

    // Value that triggered the achievement (e.g. WPM at unlock time)
    triggerValue: { type: Number, default: null },

    unlockedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate achievement records for same user + key
achievementSchema.index({ user: 1, key: 1 }, { unique: true });
achievementSchema.index({ user: 1, unlockedAt: -1 });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
