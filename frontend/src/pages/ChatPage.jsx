import {useEffect, useRef, useState} from 'react';
import {socket} from "../services/socket";
import {api, setAuthToken} from '../services/api';
import {ChatWindow} from '../components/ChatWindow';
import {useTheme} from '../context/ThemeContext';

const formatSidebarTime = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return d.toLocaleDateString(); // 20/03/2026
};

export const ChatPage = () => {
    const {theme, toggleTheme} = useTheme();
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [me, setMe] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});

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

    useEffect(() => {
        const handlePresenceUpdate = ({ userId, online }) => {
            setOnlineUsers(prev => ({
                ...prev,
                [userId]: online
            }));
        };

        const handlePresenceList = (userIds) => {
            const map = {};
            userIds.forEach(id => {
                map[id] = true;
            });
            setOnlineUsers(map);
        };

        socket.on("presence:update", handlePresenceUpdate);
        socket.on("presence:list", handlePresenceList);

        return () => {
            socket.off("presence:update", handlePresenceUpdate);
            socket.off("presence:list", handlePresenceList);
        };
    }, []);

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

                <h3>Chats</h3>

                {chats.map((chat) => {
                    const otherUser = chat.members?.find(
                        (member) => member._id !== me._id
                    );

                    return (
                        <div
                            key={chat._id}
                            onClick={() => setActiveChatId(chat._id)}
                            style={{
                                padding: "10px",
                                cursor: "pointer",
                                background: activeChatId === chat._id ? "#333" : "transparent",
                                color: "white",
                                marginBottom: "8px",
                                borderRadius: "5px"
                            }}
                        >
                            {/* Name */}
                            <div style={{ fontWeight: "bold" }}>
                                {chat.isGroup ? chat.name : otherUser ? (otherUser.name || otherUser.email) : "Unknown User"}
                            </div>

                            {/* Last Message */}
                            <div style={{ fontSize: "12px", color: "#aaa" }}>
                                {chat.lastMessage?.text || "No messages yet"}
                            </div>

                            <div style={{ fontSize: "10px", color: "#777" }}>
                                {chat.lastMessage?.createdAt
                                    ? formatSidebarTime(chat.lastMessage.createdAt)
                                    : ""
                                }
                            </div>
                        </div>
                    );
                })}

                <hr />

                <h3>Users</h3>

                {users.map((user) => (
                    <div
                        key={user._id}
                        style={{
                            padding: "8px",
                            borderBottom: "1px solid gray",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                            {/* Online Dot */}
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: onlineUsers[user._id] ? "limegreen" : "gray"
                            }} />

                            {/* User Name */}
                            <span
                                onClick={() => startChat(user._id)}
                                style={{ cursor: "pointer" }}
                            >
                                {user.name || user.email}
                            </span>
                        </div>

                        <button
                            onClick={async () => {
                                await api.delete(`/users/${user._id}`);
                                setUsers(prev => prev.filter(u => u._id !== user._id));
                            }}
                            style={{
                                background: "red",
                                color: "white",
                                border: "none",
                                padding: "4px 8px",
                                cursor: "pointer"
                            }}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            {/* Right Chat Window */}
            <div style={{ flex: 1, padding: "20px" }}>
                {activeChatId ? (
                    <>
                        {/* Chat Header */}
                        {(() => {
                            const activeChat = chats.find(c => c._id === activeChatId);
                            const otherUser = activeChat?.members?.find(
                                m => m._id !== me._id
                            );

                            return (
                                <div style={{
                                    marginBottom: "10px",
                                    color: "white"
                                }}>
                                    <strong>
                                        {otherUser?.name || otherUser?.email || "User"}
                                    </strong>

                                    <span style={{
                                        marginLeft: "10px",
                                        color: onlineUsers[otherUser?._id] ? "limegreen" : "gray",
                                        fontSize: "12px"
                                    }}>
                                        {onlineUsers[otherUser?._id] ? "● Online" : "● Offline"}
                                    </span>
                                </div>
                            );
                        })()}

                        <ChatWindow
                            socket={socket}
                            activeChatId={activeChatId}
                            me={me}
                        />
                    </>
                ) : (
                    <p>Select a chat</p>
                )}
            </div>

        </div>
    );
};
