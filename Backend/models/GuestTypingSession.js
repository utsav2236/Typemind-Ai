import mongoose from 'mongoose';

const guestTypingSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  testId: {
    type: String,
    required: true,
    unique: true,
  },
  duration: {
    type: Number,
    required: true,
    enum: [30, 60, 180, 300],
  },
  textHash: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
    required: true,
  },
  topic: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL index: documents automatically expire after 24 hours (86400 seconds)
  }
});

const GuestTypingSession = mongoose.model('GuestTypingSession', guestTypingSessionSchema);
export default GuestTypingSession;
