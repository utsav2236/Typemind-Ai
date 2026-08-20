// models/User.js
// Core user model with stats, preferences, and bcrypt password hashing.

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const statsSchema = new mongoose.Schema(
  {
    totalTests:        { type: Number, default: 0 },
    totalWords:        { type: Number, default: 0 },
    totalPracticeTime: { type: Number, default: 0 }, // seconds
    bestWpm:           { type: Number, default: 0 },
    averageWpm:        { type: Number, default: 0 },
    averageAccuracy:   { type: Number, default: 0 },
    typingIQ:          { type: Number, default: 0 },
    currentStreak:     { type: Number, default: 0 },
    longestStreak:     { type: Number, default: 0 },
    lastPracticeDate:  { type: Date, default: null },
  },
  { _id: false }
);

const preferencesSchema = new mongoose.Schema(
  {
    theme:               { type: String, default: 'dark', enum: ['dark', 'light', 'system'] },
    soundEnabled:        { type: Boolean, default: true },
    defaultDuration:     { type: Number, default: 60, enum: [15, 30, 60, 120, 300] },
    language:            { type: String, default: 'en' },
    keyboardLayout:      { type: String, default: 'qwerty', enum: ['qwerty', 'dvorak', 'colemak'] },
    leaderboardVisible:  { type: Boolean, default: true },
    timezone:            { type: String, default: 'UTC' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    avatar: {
      type: String,
      default: '',
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    stats: {
      type: statsSchema,
      default: () => ({}),
    },

    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// email unique index is auto-created by { unique: true } on the field
userSchema.index({ 'stats.bestWpm': -1 }); // For leaderboard queries

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  next();
});

// ── Instance method: compare password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: safe public object (no password) ────────────────────────
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
