import {useEffect, useRef, useState} from 'react';
import {socket} from "../services/socket";
import {api, setAuthToken} from '../services/api';
import {ChatWindow} from '../components/ChatWindow';
import {useTheme} from '../context/ThemeContext';

export const ChatPage = () => {
    const {theme, toggleTheme} = useTheme();
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [me, setMe] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [users, setUsers] = useState([]);

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

        socket.auth = {token};

        if (!socket.connected) {
            socket.connect();
        }

        if (!hasEmitted.current) {
            socket.emit('presence:online', userId);
            hasEmitted.current = true;
        }

        api.get('/chats').then(({data}) => {
            setChats(data);
            if (data[0]) setActiveChatId(data[0]._id);
        });

        api.get('/users').then(({data}) => {
            setUsers(data);
        });
    }, [token]);

    useEffect(() => {
        if (!activeChatId) return;

        socket.emit("chat:join", activeChatId);
        console.log("✅ Joined chat:", activeChatId);
    }, [activeChatId]);

    const login = async (formData) => {
        const {data} = await api.post('/auth/login', formData);
        setToken(data.token);
        localStorage.setItem('me', JSON.stringify(data.user));
    };

    const createChat = async () => {
        const otherUserId = prompt("Enter other user ID");

        if (!otherUserId || otherUserId.trim() === "") {
            alert("User ID is required");
            return;
        }

        const { data } = await api.post('/chats', {
            name: "New Chat",
            memberIds: [otherUserId]
        });

        console.log("Created chat:", data);
        setChats((prev) => [data, ...prev]);
        setActiveChatId(data._id);
    };

    const startChat = async (userId) => {
        try {
            const { data } = await api.post('/chats', {
                memberIds: [userId]
            });

            setChats((prev) => {
                const exists = prev.find(c => c._id === data._id);
                if (exists) return prev;
                return [data, ...prev];
            });

            setActiveChatId(data._id);
        }
        catch (err) {
            console.error("Chat creation error:", err);
        }
    };

    if (!token) {
        return (
            <main>
                <h1>Real-Time Chat App</h1>
                <button onClick={() => login({email: 'demo@mail.com', password: 'password'})}>Quick Login</button>
            </main>
        );
    }

    if (!me) return <p>Loading...</p>;

    return (
        <div style={{ display: "flex", height: "100vh" }}>

            {/* LEFT SIDEBAR */}
            <div style={{
                width: "250px",
                borderRight: "1px solid gray",
                padding: "10px"
            }}>
                <h2>Chats</h2>

                <button onClick={toggleTheme}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                <br /><br />

                <button onClick={createChat}>+ Create Chat</button>

                <hr />

                <h3>Users</h3>

                {users.map((user) => (
                    <div
                        key={user._id}
                        onClick={() => startChat(user._id)}
                        style={{
                            padding: "8px",
                            cursor: "pointer",
                            borderBottom: "1px solid gray"
                        }}
                    >
                        {user.name || user.email}
                    </div>
                ))}
            </div>

            {/* RIGHT CHAT WINDOW */}
            <div style={{ flex: 1, padding: "20px" }}>
                {activeChatId ? (
                    <ChatWindow
                        socket={socket}
                        activeChatId={activeChatId}
                        me={me}
                    />
                ) : (
                    <p>Select a chat</p>
                )}
            </div>

        </div>
    );
};
