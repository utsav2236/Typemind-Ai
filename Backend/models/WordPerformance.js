// models/WordPerformance.js
// Aggregates cross-session word performance per user.

import mongoose from 'mongoose';

const wordStatSchema = new mongoose.Schema(
  {
    word:                  { type: String, required: true },
    attempts:              { type: Number, default: 0 },
    correct:               { type: Number, default: 0 },
    incorrect:             { type: Number, default: 0 },
    accuracy:              { type: Number, default: 0 },    // %
    totalCompletionTime:   { type: Number, default: 0 },    // ms (rolling sum)
    averageCompletionTime: { type: Number, default: 0 },    // ms
    lastSeen:              { type: Date,   default: Date.now },
  },
  { _id: false }
);

const wordPerformanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    words: [wordStatSchema],

    lastUpdated:  { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// user unique index is auto-created by { unique: true } on the field

const WordPerformance = mongoose.model('WordPerformance', wordPerformanceSchema);
export default WordPerformance;
