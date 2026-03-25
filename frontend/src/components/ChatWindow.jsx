import { useEffect, useState } from "react";

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

            {/* MESSAGE DISPLAY AREA */}
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

                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        style={{
                            textAlign: msg.senderId === me?._id ? "right" : "left",
                            margin: "5px 0",
                        }}
                    >
                    <span
                        style={{
                            background: msg.senderId === me?._id ? "#4caf50" : "#444",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            display: "inline-block",
                            color: "white",
                        }}
                    >
                        {msg.text}
                    </span>
                    </div>
                ))}
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
