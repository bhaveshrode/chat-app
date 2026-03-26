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

export const ChatWindow = ({ socket, activeChatId, me }) => {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);

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
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* INPUT AREA */}
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
                style={{ width: "70%" }}
            />

            <button onClick={sendMessage}>Send</button>
        </section>
    );
};
