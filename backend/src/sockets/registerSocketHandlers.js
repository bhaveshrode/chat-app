import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Chat } from "../models/Chat.js"

export const registerSocketHandlers = (io) => {
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log("🔌 User connected:", socket.id);

        socket.on('presence:online', async (userId) => {
            if (!userId) {
                console.warn("⚠️ Received null userId");
                return;
            }

            onlineUsers.set(userId, socket.id);
            socket.data.userId = userId;

            console.log(`🟢 User connected: ${userId}`);

            // Send Full Online List to This User
            socket.emit('presence:list', Array.from(onlineUsers.keys()));

            // Update Others
            socket.broadcast.emit('presence:update', { userId, online: true });

            await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
        });

        socket.on('chat:join', (chatId) => {
            console.log(`User joined room: ${chatId}`);
            socket.join(chatId);
        });

        socket.on('message:new', async ({ chatId, message }) => {
            try{
                const savedMessage = await Message.create({
                    chatId: chatId,
                    senderId: message.sender,
                    text: message.text,
                });

                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: savedMessage._id
                });

                io.to(chatId).emit('message:new', savedMessage);
            }
            catch(err){
                console.error("❌ Error saving message:", err);
            }
        });

        socket.on('typing:start', ({ chatId, userId }) => {
            socket.to(chatId).emit('typing:start', { chatId, userId });
        });

        socket.on('typing:stop', ({ chatId, userId }) => {
            socket.to(chatId).emit('typing:stop', { chatId, userId });
        });

        socket.on('message:seen', async ({ messageId, userId, chatId }) => {
            await Message.findByIdAndUpdate(messageId, { $addToSet: { seenBy: userId } });
            io.to(chatId).emit('message:seen', { messageId, userId });
        });

        socket.on('disconnect', async () => {
            console.log("User disconnected:", socket.id);

            const userId = socket.data.userId;
            if (!userId) return;

            onlineUsers.delete(userId);
            io.emit('presence:update', { userId, online: false });
            await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
        });
    });
};
