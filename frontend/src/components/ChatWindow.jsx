import { useEffect, useState } from "react";

const formatMessageTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatMessageDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return null;
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString(); // e.g. 20/03/2026
};

export const ChatWindow = ({ socket, activeChatId, me, users }) => {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [typingTimeout, setTypingTimeout] = useState(null);

    const getUserName = (id) => {
        const user = users.find(u =>u._id === id);
        return user?.name || user?.email || "User";
    };

    // Receive messages
    useEffect(() => {
        const handler = (msg) => {
            console.log("📩 Message received:", msg);

            setMessages((prev) => [...prev, msg]);
        };

        socket.on("message:new", handler);

        return () => socket.off("message:new", handler);
    }, [socket, activeChatId]);

    useEffect(() => {
        if (!activeChatId) return;

        fetch(`http://localhost:5000/api/messages/${activeChatId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch messages.");
                return res.json();
            })
            .then(data => {
                console.log("📦 Loaded messages:", data);
                setMessages(data);
            })
            .catch(err => {
                console.error("❌ Fetch error:", err);
            });
    }, [activeChatId]);

    useEffect(() => {
        const handleTypingStart = ({ userId }) => {
            setTypingUsers(prev => ({
                ...prev,
                [userId]: true
            }));
        };

        const handleTypingStop = ({ userId }) => {
            setTypingUsers(prev => ({
                ...prev,
                [userId]: false
            }));
        };

        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        return () => {
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
        };
    }, []);

    useEffect(() => {
        const handleSeen = ({ chatId }) => {
            if (chatId !== activeChatId) return;

            setMessages(prev =>
                prev.map(msg => ({
                    ...msg,
                    status: "seen"
                }))
            );
        };

        socket.on("message:seen", handleSeen);

        return () => socket.off("message:seen", handleSeen);
    }, [activeChatId]);

    // Send message
    const sendMessage = () => {
        if (!text.trim() || !activeChatId) return;

        const message = {
            text,
            sender: me._id,
        };

        socket.emit("message:new", {
            chatId: activeChatId,
            message,
        });

        setText("");
    };

    return (
        <section style={{ marginTop: "20px" }}>

            {/* Message Display Area */}
            <div
                style={{
                    height: "300px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    padding: "10px",
                    marginBottom: "10px",
                    background: "#111"
                }}
            >
                {messages.length === 0 && <p>No messages yet</p>}

                {messages.map((msg, index) => {
                    const showDate =
                        index === 0 ||
                        new Date(messages[index - 1].createdAt).toDateString() !==
                        new Date(msg.createdAt).toDateString();

                    return (
                        <div key={msg._id}>

                            {/* Date Header */}
                            {showDate && (
                                <div style={{
                                    textAlign: "center",
                                    margin: "10px 0",
                                    color: "#aaa",
                                    fontSize: "12px"
                                }}>
                                    {formatMessageDate(msg.createdAt) || "Today"}
                                </div>
                            )}

                            {/* Message */}
                            <div
                                style={{
                                    textAlign: msg.senderId === me?._id ? "right" : "left",
                                    margin: "5px 0",
                                }}
                            >
                                <div
                                    style={{
                                        background: msg.senderId === me?._id ? "#4caf50" : "#444",
                                        padding: "8px 12px",
                                        borderRadius: "10px",
                                        display: "inline-block",
                                        color: "white",
                                        maxWidth: "60%"
                                    }}
                                >
                                    <div>{msg.text}</div>

                                    {/* Time */}
                                    <div style={{
                                        fontSize: "10px",
                                        color: "#ddd",
                                        marginTop: "2px",
                                        textAlign: "right"
                                    }}>
                                        {formatMessageTime(msg.createdAt)}
                                    </div>

                                    <div style={{
                                        fontSize: "10px",
                                        color: msg.status === "seen" ? "dodgerblue" : "#aaa",
                                        marginTop: "2px",
                                        textAlign: "right"
                                    }}>
                                        {msg.status === "seen" && "✔✔"}
                                        {msg.status === "delivered" && "✔✔"}
                                        {msg.status === "sent" && "✔"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {Object.entries(typingUsers)
                .filter(([_, isTyping]) => isTyping)
                .map(([userId]) => (
                    userId !== me._id && (
                        <div
                            key={userId}
                            style={{ color: "gray", fontSize: "12px", marginBottom: "5px" }}
                        >
                            {getUserName(userId)} is typing...
                        </div>
                    )
                ))
            }

            {/* Input Area */}
            <input
                value={text}
                onChange={(e) => {
                    setText(e.target.value);

                    socket.emit("typing:start", {
                        chatId: activeChatId,
                        userId: me._id
                    });

                    // Stop typing after delay
                    if (typingTimeout) clearTimeout(typingTimeout);

                    const timeout = setTimeout(() => {
                        socket.emit("typing:stop", {
                            chatId: activeChatId,
                            userId: me._id
                        });
                    }, 1000);

                    setTypingTimeout(timeout);
                }}
            />

            <button onClick={sendMessage}>Send</button>
        </section>
    );
};
