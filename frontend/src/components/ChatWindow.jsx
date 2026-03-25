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

        return () => socket.off("message:new");
    }, [socket, activeChatId]);

    // Send message
    const sendMessage = () => {
        if (!text.trim() || !activeChatId) return;

        const message = {
            _id: Date.now().toString() + Math.random(),
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
                            textAlign: msg.sender === me._id ? "right" : "left",
                            margin: "5px 0",
                        }}
                    >
                    <span
                        style={{
                            background: msg.sender === me._id ? "#4caf50" : "#444",
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
