import dotenv from 'dotenv';

dotenv.config();

export const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_app',
    jwtSecret: process.env.JWT_SECRET || 'change-me',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
};