import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté');
};
