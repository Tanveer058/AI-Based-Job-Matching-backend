import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI, {
      dbName: 'ai-based-job-matching-platform', // This is the database name
    });
    console.log(`MongoDB Connected to ${process.env.MONGO_URI}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }
};

export default connectDB;
