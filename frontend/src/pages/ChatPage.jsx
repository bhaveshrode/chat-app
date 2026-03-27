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
    const hasEmitted = useRef(false);
    const [deleteChatPopup, setDeleteChatPopup] = useState({
        visible: false,
        chatId: null
    });
    const [unreadCounts, setUnreadCounts] = useState({});

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

        api.get('/chats/unread').then(({ data }) => {
            const map = {};
            data.forEach(item => {
                map[item.chatId] = item.unread;
            });
            setUnreadCounts(map);
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

    useEffect(() => {
        const handleNewMessage = (msg) => {
            if (msg.chatId === activeChatId) {
                // Auto Mark As Seen
                socket.emit("chat:markSeen", {
                    chatId: msg.chatId,
                    userId: me._id
                });

            } else {
                // Increase Unread
                setUnreadCounts(prev => ({
                    ...prev,
                    [msg.chatId]: (prev[msg.chatId] || 0) + 1
                }));
            }
        };

        socket.on("message:new", handleNewMessage);

        return () => {
            socket.off("message:new", handleNewMessage);
        };
    }, [activeChatId, me]);

    useEffect(() => {
        if (!activeChatId || !me) return;

        socket.emit("chat:markSeen", {
            chatId: activeChatId,
            userId: me._id
        });

        setUnreadCounts(prev => ({
            ...prev,
            [activeChatId]: 0
        }));
    }, [activeChatId, me]);

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
                            style={{
                                padding: "10px",
                                cursor: "pointer",
                                background: activeChatId === chat._id ? "#333" : "transparent",
                                color: "white",
                                marginBottom: "8px",
                                borderRadius: "5px"
                            }}
                        >
                            {/* CLICK AREA */}
                            <div onClick={() => {
                                    setActiveChatId(chat._id);

                                    socket.emit("chat:markSeen", {
                                        chatId: chat._id,
                                        userId: me._id
                                    });

                                    setUnreadCounts(prev => ({
                                        ...prev,
                                        [chat._id]: 0
                                    }));
                                }}
                            >

                                {/* Name */}
                                <div style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                                    <span>
                                        {chat.isGroup
                                            ? chat.name
                                            : otherUser
                                                ? (otherUser.name || otherUser.email)
                                                : "Unknown User"}
                                    </span>

                                    {unreadCounts[chat._id] > 0 && (
                                        <span style={{
                                            background: "red",
                                            color: "white",
                                            borderRadius: "50%",
                                            padding: "4px 8px",
                                            fontSize: "12px"
                                        }}>
                                            {unreadCounts[chat._id]}
                                        </span>
                                    )}
                                </div>

                                {/* Last Message */}
                                <div style={{ fontSize: "12px", color: "#aaa" }}>
                                    {chat.lastMessage?.text || "No messages yet"}
                                </div>

                                {/* Time */}
                                <div style={{ fontSize: "10px", color: "#777" }}>
                                    {chat.lastMessage?.createdAt
                                        ? formatSidebarTime(chat.lastMessage.createdAt)
                                        : ""}
                                </div>
                            </div>

                            {/* DELETE BUTTON (outside click area) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteChatPopup({
                                        visible: true,
                                        chatId: chat._id
                                    });
                                }}
                                style={{
                                    marginTop: "5px",
                                    background: "red",
                                    color: "white",
                                    border: "none",
                                    padding: "3px 6px",
                                    cursor: "pointer"
                                }}
                            >
                                Delete
                            </button>
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

                        {/* ❗ Only show delete if NOT current user */}
                        {user._id !== me._id && (
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
                        )}
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
                            users={users}
                        />
                    </>
                ) : (
                    <p>Select a chat</p>
                )}
            </div>

                    {deleteChatPopup.visible && (
                        <div style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000
                        }}>
                            <div style={{
                                background: "#222",
                                padding: "20px",
                                borderRadius: "10px",
                                textAlign: "center"
                            }}>
                                <h3 style={{ color: "white" }}>Delete Chat?</h3>

                                <button
                                    onClick={async () => {
                                        try {
                                            await api.delete(`/chats/${deleteChatPopup.chatId}`);

                                            // Remove from UI instantly
                                            setChats(prev =>
                                                prev.filter(c => c._id !== deleteChatPopup.chatId)
                                            );

                                            // Reset active chat
                                            if (activeChatId === deleteChatPopup.chatId) {
                                                setActiveChatId(null);
                                            }

                                            setDeleteChatPopup({ visible: false, chatId: null });
                                        } catch (err) {
                                            console.error("Delete chat error:", err);
                                        }
                                    }}
                                    style={{
                                        background: "red",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Delete
                                </button>

                                <br /><br />

                                <button
                                    onClick={() =>
                                        setDeleteChatPopup({ visible: false, chatId: null })
                                    }
                                    style={{
                                        padding: "6px 12px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
        </div>
    );
};
