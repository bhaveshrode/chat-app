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

        socket.on('chat:join', async (chatId) => {
            await Message.updateMany(
                {
                    chatId: chatId,
                    senderId: { $ne: socket.data.userId },
                    status: { $ne: "seen" }
                },
                { status: "seen" }
            );

            // notify sender
            io.to(chatId).emit("message:seen", {
                chatId,
                userId: socket.data.userId
            });

            console.log(`User joined room: ${chatId}`);
            socket.join(chatId);
        });

        socket.on('message:new', async ({ chatId, message }) => {
            try{
                const savedMessage = await Message.create({
                    chatId: chatId,
                    senderId: message.sender,
                    text: message.text,
                    status: "sent"
                });

                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: savedMessage._id
                });

                io.to(chatId).emit('message:new', savedMessage);

                await Message.findByIdAndUpdate(savedMessage._id, {
                    status: "delivered"
                });
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

        socket.on("message:delete", async ({ messageId, type, userId, chatId }) => {
            try {
                if (type === "everyone") {
                    await Message.findByIdAndUpdate(messageId, {
                        isDeleted: true,
                        text: "This message was deleted"
                    });

                    io.to(chatId).emit("message:deleted", {
                        messageId,
                        type: "everyone"
                    });

                } else if (type === "me") {
                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: { deletedFor: userId }
                    });

                    socket.emit("message:deleted", {
                        messageId,
                        type: "me"
                    });
                }
            } catch (err) {
                console.error("❌ Delete error:", err);
            }
        });
    });
};
