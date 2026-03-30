import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { authMiddleware } from './middleware/auth.js';
import { chatRouter } from './routes/chat.routes.js';
import { messageRouter } from './routes/message.routes.js';
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import downloadRoutes from "./routes/download.routes.js";

export const createApp = () => {
    const app = express();

    app.use(cors({ origin: env.clientUrl }));
    app.use(express.json());
    app.use('/uploads', express.static("uploads"));
    app.use("/api/upload", uploadRoutes);
    app.use("/api", downloadRoutes);

    app.get("/", (_req, res) => {
        res.send("Backend is running");
    });

    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    app.use('/api/auth', authRouter(env.jwtSecret));

    const auth = authMiddleware(env.jwtSecret);
    app.use('/api/chats', auth, chatRouter);
    app.use('/api/messages', auth, messageRouter(env.uploadDir));
    app.use("/api/users", userRoutes);

    app.get("/api/download/:filename", (req, res) => {
        const filePath = `uploads/${req.params.filename}`;
        res.download(filePath); // forces download
    });

    return app;
};