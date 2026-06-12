import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
  console.log('MongoDB connected');
}
