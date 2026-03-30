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
        <div className="flex h-screen bg-slate-900 text-white overflow-hidden">

            {/* Sidebar */}
            <div className="w-72 bg-slate-800 p-4 flex flex-col">

                <h2 className="text-xl font-bold mb-4">Chats</h2>

                <button
                    onClick={toggleTheme}
                    className="mb-3 bg-slate-700 p-2 rounded-lg"
                >
                    Toggle Theme
                </button>

                <button
                    onClick={createChat}
                    className="bg-green-500 hover:bg-green-600 p-2 rounded-lg mb-4"
                >
                    + Create Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {chats.map(chat => {
                        const otherUser = chat.members?.find(m => m._id !== me._id);

                        return (
                            <div
                                key={chat._id}
                                onClick={() => setActiveChatId(chat._id)}
                                className={`p-3 rounded-lg cursor-pointer ${
                                    activeChatId === chat._id
                                        ? "bg-slate-700"
                                        : "hover:bg-slate-700"
                                }`}
                            >
                                <div className="flex justify-between">
                            <span className="font-semibold">
                                {otherUser?.name || otherUser?.email}
                            </span>

                                    {unreadCounts[chat._id] > 0 && (
                                        <span className="bg-red-500 px-2 rounded-full text-xs">
                                    {unreadCounts[chat._id]}
                                </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-400">
                                    {chat.lastMessage?.text || "No messages"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-3 border-b border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-lg">
                        Chat
                    </span>

                    <span className="text-sm text-gray-400">
                        Online
                    </span>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                    {activeChatId ? (
                        <ChatWindow
                            socket={socket}
                            activeChatId={activeChatId}
                            me={me}
                            users={users}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p className="text-lg">No chat selected</p>
                            <p className="text-sm">Start a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};