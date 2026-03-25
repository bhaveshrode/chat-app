import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export const registerSocketHandlers = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('presence:online', async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.data.userId = userId;
      io.emit('presence:update', { userId, online: true });
      await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    });

    socket.on('chat:join', (chatId) => socket.join(chatId));

    socket.on('message:new', async ({ chatId, message }) => {
      io.to(chatId).emit('message:new', message);
      await Message.findByIdAndUpdate(message._id, { $set: { updatedAt: new Date() } });
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
      const userId = socket.data.userId;
      if (!userId) return;

      onlineUsers.delete(userId);
      io.emit('presence:update', { userId, online: false });
      await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
    });
  });
};
