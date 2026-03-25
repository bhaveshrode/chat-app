import mongoose from 'mongoose';

export const connectDb = async (mongoUri) => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};
