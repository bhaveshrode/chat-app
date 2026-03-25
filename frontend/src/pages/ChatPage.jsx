import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api, setAuthToken } from '../services/api';
import { ChatWindow } from '../components/ChatWindow';
import { useTheme } from '../context/ThemeContext';

const SOCKET_URL = 'http://localhost:5000';

export const ChatPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');

  const socket = useMemo(() => io(SOCKET_URL, { autoConnect: !!token }), [token]);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem('token', token);
    setAuthToken(token);

    // In production, decode token or fetch /me profile.
    const meMock = JSON.parse(localStorage.getItem('me') || '{"id":"demo-user","name":"Demo"}');
    setMe(meMock);
    socket.connect();
    socket.emit('presence:online', meMock.id);

    api.get('/chats').then(({ data }) => {
      setChats(data);
      if (data[0]) setActiveChatId(data[0]._id);
    });

    return () => socket.disconnect();
  }, [token, socket]);

  const login = async (formData) => {
    const { data } = await api.post('/auth/login', formData);
    setToken(data.token);
    localStorage.setItem('me', JSON.stringify(data.user));
  };

  if (!token) {
    return (
      <main>
        <h1>Real-Time Chat App</h1>
        <button onClick={() => login({ email: 'demo@mail.com', password: 'password' })}>Quick Login</button>
      </main>
    );
  }

  if (!me) return <p>Loading...</p>;

  return (
    <main>
      <header>
        <h1>Chats</h1>
        <button onClick={toggleTheme}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
      </header>

      <aside>
        {chats.map((chat) => (
          <button key={chat._id} onClick={() => setActiveChatId(chat._id)}>
            {chat.name || 'Direct Chat'}
          </button>
        ))}
      </aside>

      <ChatWindow socket={socket} activeChatId={activeChatId} me={me} />
    </main>
  );
};
