import mongoose from 'mongoose';
import { env } from '../config/env';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = env.mongoUri || 'mongodb://localhost:27017/sistema_pagamentos';
  const startedAt = Date.now();
  try {
    console.log(`[DB] Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri, {});
    const ms = Date.now() - startedAt;
    console.log(`✅ MongoDB connected (${ms}ms)`);

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 MongoDB connection closed (SIGINT)');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default mongoose;