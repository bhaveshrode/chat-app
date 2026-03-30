import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { registerSocketHandlers } from './sockets/registerSocketHandlers.js';

const bootstrap = async () => {
    try {
        await connectDb(env.mongoUri);

        const app = createApp();
        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: env.clientUrl
            }
        });

        registerSocketHandlers(io);

        server.listen(env.port, () => {
            console.log(`Server running on http://localhost:${env.port}`);
        });

    } catch (error) {
        console.error("Startup error:", error.message);
        process.exit(1);
    }
};

bootstrap();