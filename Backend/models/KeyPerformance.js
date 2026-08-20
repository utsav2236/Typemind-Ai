// models/KeyPerformance.js
// Aggregates cross-session key performance per user.
// Updated after every session to maintain a rolling historical picture.

import mongoose from 'mongoose';

const keyStatSchema = new mongoose.Schema(
  {
    key:                 { type: String, required: true },
    attempts:            { type: Number, default: 0 },
    correct:             { type: Number, default: 0 },
    incorrect:           { type: Number, default: 0 },
    accuracy:            { type: Number, default: 0 },    // %
    errorRate:           { type: Number, default: 0 },    // %
    averageResponseTime: { type: Number, default: 0 },    // ms
    totalResponseTime:   { type: Number, default: 0 },    // ms (for rolling avg)
    lastSeen:            { type: Date,   default: Date.now },
  },
  { _id: false }
);

const keyPerformanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Map of key → stats (stored as array for MongoDB indexing)
    keys: [keyStatSchema],

    lastUpdated: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Fast lookup by user (unique ensures single document per user)
// user unique index is auto-created by { unique: true } on the field

const KeyPerformance = mongoose.model('KeyPerformance', keyPerformanceSchema);
export default KeyPerformance;
