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
    const [deletePopup, setDeletePopup] = useState({
        visible: false,
        messageId: null
    });
    const [file, setFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUpload, setPreviewUpload] = useState(null);

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

    useEffect(() => {
        const handleDelete = ({ messageId, type }) => {
            setMessages(prev =>
                prev.map(msg => {
                    if (msg._id !== messageId) return msg;

                    if (type === "everyone") {
                        return {
                            ...msg,
                            text: "This message was deleted",
                            isDeleted: true
                        };
                    }

                    return msg;
                })
                    .filter(msg => {
                        if (msg._id === messageId && type === "me") {
                            return false;
                        }
                        return true;
                    })
            );
        };

        socket.on("message:deleted", handleDelete);
        return () => socket.off("message:deleted", handleDelete);
    }, []);

    // Send message
    const sendMessage = async () => {
        if (!activeChatId) return;

        let fileData = null;

        // Upload file if exists
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://localhost:5000/api/upload", {
                method: "POST",
                body: formData
            });

            fileData = await res.json();
        }

        // Send message via socket
        socket.emit("message:new", {
            chatId: activeChatId,
            message: {
                sender: me._id,
                text,
                fileUrl: fileData?.fileUrl,
                fileType: fileData?.fileType
            }
        });

        setText("");
        setFile(null);

        setPreviewUpload(null);
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
                                    <div>
                                        {msg.text && <div>{msg.text}</div>}

                                        {msg.fileUrl && (
                                            msg.fileType?.startsWith("image") ? (
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        display: "inline-block",
                                                        marginTop: "5px"
                                                    }}
                                                >
                                                    <img
                                                        src={`http://localhost:5000${msg.fileUrl}`}
                                                        alt="file"
                                                        style={{
                                                            maxWidth: "200px",
                                                            borderRadius: "10px",
                                                            display: "block"
                                                        }}
                                                    />

                                                    {/* Overlay */}
                                                    <a
                                                        href={`http://localhost:5000/api/download?file=${msg.fileUrl}`}
                                                        style={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: "100%",
                                                            height: "100%",
                                                            background: "rgba(0,0,0,0.4)",
                                                            color: "white",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "24px",
                                                            opacity: 0,
                                                            textDecoration: "none",
                                                            borderRadius: "10px",
                                                            transition: "opacity 0.3s"
                                                        }}
                                                        className="download-overlay"
                                                    >
                                                        ⬇
                                                    </a>
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: "5px" }}>
                                                    <span
                                                        onClick={() => setPreviewFile(msg)}
                                                        style={{
                                                            cursor: "pointer",
                                                            color: "lightblue",
                                                            textDecoration: "underline"
                                                        }}
                                                    >
                                                        📎 {msg.fileUrl.split("/").pop()}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {msg.senderId === me._id && !msg.isDeleted && (
                                        <div style={{ marginTop: "5px" }}>
                                            <button onClick={() => {
                                                setDeletePopup({
                                                    visible: true,
                                                    messageId: msg._id
                                                });
                                            }}>
                                                Delete
                                            </button>
                                        </div>
                                    )}

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

            <br />

            <input
                type="file"
                onChange={(e) => {
                    const selected = e.target.files[0];
                    setFile(selected);
                    setPreviewUpload(selected);
                }}
            />

            {previewUpload && (
                <div style={{
                    background: "#222",
                    padding: "10px",
                    borderRadius: "8px",
                    marginTop: "10px",
                    color: "white"
                }}>
                    <p>Preview:</p>

                    {/* IMAGE */}
                    {previewUpload.type.startsWith("image") && (
                        <img
                            src={URL.createObjectURL(previewUpload)}
                            style={{ maxWidth: "150px" }}
                        />
                    )}

                    {/* PDF */}
                    {previewUpload.type === "application/pdf" && (
                        <iframe
                            src={URL.createObjectURL(previewUpload)}
                            style={{ width: "300px", height: "200px" }}
                        />
                    )}

                    {/* TEXT */}
                    {previewUpload.type.startsWith("text") && (
                        <iframe
                            src={URL.createObjectURL(previewUpload)}
                            style={{
                                width: "300px",
                                height: "200px",
                                background: "white"
                            }}
                        />
                    )}

                    {/* FALLBACK */}
                    {!previewUpload.type.startsWith("image") &&
                        previewUpload.type !== "application/pdf" &&
                        !previewUpload.type.startsWith("text") && (
                            <p>📎 {previewUpload.name}</p>
                        )}

                    <button onClick={() => setPreviewUpload(null)}>
                        Cancel
                    </button>
                </div>
            )}

            <button onClick={sendMessage}>Send</button>

            {deletePopup.visible && (
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
                        <h4 style={{ color: "white" }}>Delete Message?</h4>

                        <button onClick={() => {
                            socket.emit("message:delete", {
                                messageId: deletePopup.messageId,
                                type: "me",
                                userId: me._id,
                                chatId: activeChatId
                            });
                            setDeletePopup({ visible: false, messageId: null });
                        }}>
                            Delete for Me
                        </button>

                        <br /><br />

                        <button onClick={() => {
                            socket.emit("message:delete", {
                                messageId: deletePopup.messageId,
                                type: "everyone",
                                userId: me._id,
                                chatId: activeChatId
                            });
                            setDeletePopup({ visible: false, messageId: null });
                        }}>
                            Delete for Everyone
                        </button>

                        <br /><br />

                        <button onClick={() => {
                            setDeletePopup({ visible: false, messageId: null });
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {previewFile && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#111",
                        padding: "20px",
                        borderRadius: "10px",
                        maxWidth: "90%",
                        maxHeight: "90%",
                        overflow: "auto",
                        color: "white"
                    }}>

                        <h3>Preview</h3>

                        {/* IMAGE */}
                        {previewFile.fileType?.startsWith("image") && (
                            <img
                                src={`http://localhost:5000${previewFile.fileUrl}`}
                                style={{ maxWidth: "100%" }}
                            />
                        )}

                        {/* PDF PREVIEW (FIRST PAGE STYLE) */}
                        {previewFile.fileType === "application/pdf" && (
                            <iframe
                                src={`http://localhost:5000${previewFile.fileUrl}`}
                                style={{ width: "600px", height: "500px" }}
                            />
                        )}

                        {/* TEXT FILE */}
                        {previewFile.fileType?.startsWith("text") && (
                            <iframe
                                src={`http://localhost:5000${previewFile.fileUrl}`}
                                style={{
                                    width: "600px",
                                    height: "400px",
                                    background: "white"
                                }}
                            />
                        )}

                        {/* OTHER FILES */}
                        {!previewFile.fileType && (
                            <p>Preview not available</p>
                        )}

                        <br />

                        <a
                            href={`http://localhost:5000/api/download?file=${previewFile.fileUrl}`}
                            style={{
                                background: "#4CAF50",
                                padding: "10px",
                                borderRadius: "5px",
                                color: "white",
                                textDecoration: "none"
                            }}
                        >
                            ⬇ Download File
                        </a>

                        <br /><br />

                        <button onClick={() => setPreviewFile(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};
