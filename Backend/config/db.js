// config/db.js
// Establishes and manages the MongoDB connection via Mongoose.

import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('[DB] Already connected to MongoDB');
    return;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      // Mongoose 8+ does not need deprecated options
    });

    isConnected = true;
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[DB] MongoDB connection error: ${err.message}`);
    });
  } catch (err) {
    console.error(`[DB] Initial MongoDB connection failed: ${err.message}`);
    // Terminate on initial connection failure — app cannot function without DB
    process.exit(1);
  }
};

export default connectDB;
