import { useEffect, useRef, useState } from 'react';
import { socket } from "../services/socket";
import { api, setAuthToken } from '../services/api';
import { ChatWindow } from '../components/ChatWindow';
import { useTheme } from '../context/ThemeContext';

export const ChatPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [me, setMe] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState('');

    useEffect(() => {
        socket.on("connect", () => {
            console.log("✅ Frontend connected:", socket.id);
        });

        return () => socket.off("connect");
    }, []);

    const hasEmitted = useRef(false)

    useEffect(() => {
        if (!token) return;
        localStorage.setItem('token', token);
        setAuthToken(token);

        // In production, decode token or fetch /me profile.
        const meMock = JSON.parse(localStorage.getItem('me'));
        console.log("ME MOCK:", meMock);

        if (!meMock?._id) {
            console.warn("Skipping socket emit: invalid user");
            return;
        }

        setMe(meMock);

        const userId = meMock._id;

        socket.auth = { token };

        if (!socket.connected) {
            socket.connect();
        }

        if (!hasEmitted.current) {
            socket.emit('presence:online', userId);
            hasEmitted.current = true;
        }

        api.get('/chats').then(({ data }) => {
            setChats(data);
            if (data[0]) setActiveChatId(data[0]._id);
        });

        return () => {
            socket.off();
        }
    }, [token]);

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
