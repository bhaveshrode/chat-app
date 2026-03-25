import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const ChatWindow = ({ socket, activeChatId, me }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!activeChatId) return;

    socket.emit('chat:join', activeChatId);
    api.get(`/messages/${activeChatId}`).then(({ data }) => setMessages(data));
  }, [activeChatId, socket]);

  useEffect(() => {
    const onMessage = (message) => setMessages((prev) => [...prev, message]);
    const onTypingStart = ({ userId }) => setTyping(userId !== me.id);
    const onTypingStop = () => setTyping(false);

    socket.on('message:new', onMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, me.id]);

  const send = async () => {
    if (!text.trim() || !activeChatId) return;

    const { data } = await api.post(`/messages/${activeChatId}`, { text });
    socket.emit('message:new', { chatId: activeChatId, message: data });
    setText('');
  };

  const onChange = (value) => {
    setText(value);
    socket.emit('typing:start', { chatId: activeChatId, userId: me.id });
    setTimeout(() => socket.emit('typing:stop', { chatId: activeChatId, userId: me.id }), 700);
  };

  return (
    <section>
      <div>
        {messages.map((message) => (
          <p key={message._id}>
            <b>{message.senderId === me.id ? 'You' : 'User'}:</b> {message.text}{' '}
            <small>{new Date(message.createdAt).toLocaleTimeString()}</small>
            {message.seenBy?.length > 1 && ' ✔✔'}
          </p>
        ))}
      </div>
      {typing && <p>Typing...</p>}
      <input value={text} onChange={(e) => onChange(e.target.value)} placeholder="Type a message" />
      <button onClick={send}>Send</button>
    </section>
  );
};
