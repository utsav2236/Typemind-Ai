import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const migrate = async () => {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('[Migration] Updating existing users to isEmailVerified = true...');
    const result2 = await User.updateMany(
      {},
      { $set: { isEmailVerified: true } }
    );
    
    console.log(`[Migration] Updated ${result2.modifiedCount} users successfully.`);
    console.log('[Migration] Done.');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Failed:', error);
    process.exit(1);
  }
};

migrate();
