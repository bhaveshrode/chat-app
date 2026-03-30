import { useEffect, useState, useRef } from "react";

const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();

    const isToday =
        d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        d.toDateString() === yesterday.toDateString();

    if (isToday) {
        return d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    if (isYesterday) {
        return "Yesterday";
    }

    return d.toLocaleDateString();
};

export const ChatWindow = ({ socket, activeChatId, me, users }) => {
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);
    const bottomRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [activeReaction, setActiveReaction] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [deleteMenu, setDeleteMenu] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState("");

    const emojis = ["❤️", "😂", "👍", "😮", "😢"];

    // Receive messages
    useEffect(() => {
        const handler = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("message:new", handler);
        return () => socket.off("message:new", handler);
    }, [socket]);

    // Load messages
    useEffect(() => {
        if (!activeChatId) return;

        fetch(`http://localhost:5000/api/messages/${activeChatId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setMessages(data))
            .catch(console.error);
    }, [activeChatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
    }, [socket]);

    useEffect(() => {
        const handleReaction = ({ messageId, reactions }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                )
            );
        };

        socket.on("message:reaction", handleReaction);

        return () => socket.off("message:reaction", handleReaction);
    }, [socket]);

    useEffect(() => {
        const handleDelete = ({ messageId, type }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId
                        ? type === "everyone"
                            ? { ...msg, isDeleted: true, text: "" }
                            : msg
                        : msg
                )
            );
        };

        socket.on("message:deleted", handleDelete);

        return () => socket.off("message:deleted", handleDelete);
    }, [socket]);

    useEffect(() => {
        const handleSeen = ({ messageId, userId }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId
                        ? {
                            ...msg,
                            seenBy: [...(msg.seenBy || []), userId]
                        }
                        : msg
                )
            );
        };

        socket.on("message:seen", handleSeen);

        return () => socket.off("message:seen", handleSeen);
    }, [socket]);

    useEffect(() => {
        if (!activeChatId) return;

        socket.emit("chat:join", activeChatId);

    }, [activeChatId]);

    useEffect(() => {
        const handleUpdate = (updatedMsg) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === updatedMsg._id ? updatedMsg : msg
                )
            );
        };

        socket.on("message:updated", handleUpdate);

        return () => socket.off("message:updated", handleUpdate);
    }, [socket]);

    // Send message
    const sendMessage = async () => {
        if (!text.trim() && !file) return;

        let fileUrl = null;
        let fileType = null;

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://localhost:5000/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const data = await res.json();
            fileUrl = data.fileUrl;
            fileType = data.fileType;
        }

        socket.emit("message:new", {
            chatId: activeChatId,
            message: {
                sender: me._id,
                text,
                fileUrl,
                fileType,
            },
        });

        setText("");
        setFile(null);
        setPreview(null);
    };

    const getUserName = (id) => {
        const user = users.find(u => u._id === id);
        return user?.name || user?.email || "User";
    };

    const TextFilePreview = ({ url }) => {
        const [content, setContent] = useState("");

        useEffect(() => {
            fetch(url)
                .then(res => res.text())
                .then(setContent)
                .catch(() => setContent("Cannot preview file"));
        }, [url]);

        return (
            <pre className="text-xs bg-slate-900 p-2 rounded max-h-32 overflow-auto">
      {content}
    </pre>
        );
    };

    const downloadFile = (fileUrl) => {
        const filename = fileUrl.split("/").pop();

        const link = document.createElement("a");
        link.href = `http://localhost:5000/api/download/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        setFile(droppedFile);

        if (droppedFile.type.startsWith("image")) {
            setPreview(URL.createObjectURL(droppedFile));
        } else {
            setPreview(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDeleteForMe = (messageId) => {
        setMessages(prev =>
            prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, deletedFor: [...(msg.deletedFor || []), me._id] }
                    : msg
            )
        );

        setDeleteMenu(null);
    };

    const handleDeleteForEveryone = (messageId) => {
        socket.emit("message:delete", {
            messageId,
            type: "everyone",
            userId: me._id,
            chatId: activeChatId
        });

        setDeleteMenu(null);
    };

    return (
        <section className="flex flex-col h-full overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-4 bg-white dark:bg-slate-800 rounded-lg relative">
                {messages.length === 0 && (
                    <p className="text-gray-400 text-center">No messages yet</p>
                )}

                {messages.map((msg) => {
                    if (msg.deletedFor?.includes(me._id)) return null;

                    const isMe = msg.senderId === me?._id || msg.sender === me?._id;

                    return (
                        <div
                            key={msg._id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                            <div
                                className={`px-4 py-2 rounded-2xl max-w-md break-words ${
                                    isMe
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-700 text-white"
                                }`}
                            >
                                {/* Message Text */}
                                {msg.isDeleted ? (
                                    <div className="italic text-gray-400">
                                        This message was deleted
                                    </div>
                                ) : (
                                    <>
                                        {editingMessageId === msg._id ? (
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    className="flex-1 px-2 py-1 rounded bg-slate-100 text-black dark:bg-slate-700 dark:text-white outline-none"
                                                />

                                                <button
                                                    onClick={() => {
                                                        socket.emit("message:edit", {
                                                            messageId: msg._id,
                                                            newText: editingText,
                                                            chatId: activeChatId
                                                        });

                                                        setEditingMessageId(null);
                                                    }}
                                                    className="bg-white text-green-600 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-100"
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    onClick={() => setEditingMessageId(null)}
                                                    className="text-white/70 hover:text-red-300 text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {msg.text && <div>{msg.text}</div>}
                                                {msg.isEdited && (
                                                    <span className="text-xs ml-1 opacity-70">(edited)</span>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {!msg.isDeleted && msg.fileUrl && (
                                    <div className="mt-2 bg-slate-800 p-2 rounded-lg">

                                        {msg.fileType?.startsWith("image") && (
                                            <img
                                                src={`http://localhost:5000${msg.fileUrl}`}
                                                className="max-w-xs rounded-lg"
                                            />
                                        )}

                                        {msg.fileType?.includes("text") && (
                                            <TextFilePreview url={`http://localhost:5000${msg.fileUrl}`} />
                                        )}

                                        <div className="text-sm mt-1 text-gray-300">
                                            📄 {msg.fileUrl.split('/').pop()}
                                        </div>

                                        <button
                                            onClick={() => downloadFile(msg.fileUrl)}
                                            className="mt-1 text-xs bg-green-600 px-2 py-1 rounded"
                                        >
                                            Download
                                        </button>
                                    </div>
                                )}

                                {!msg.isDeleted && (
                                    <button
                                        onClick={() => setDeleteMenu(msg._id)}
                                        className="text-xs text-red-300 mt-1"
                                    >
                                        Delete
                                    </button>
                                )}

                                {!msg.isDeleted && isMe && (
                                    <button
                                        onClick={() => {
                                            setEditingMessageId(msg._id);
                                            setEditingText(msg.text);
                                        }}
                                        className="text-xs text-white/80 hover:text-white underline mt-1 mr-2"
                                    >
                                        Edit
                                    </button>
                                )}

                                {deleteMenu === msg._id && (
                                    <div className={`absolute mt-1 ${
                                        isMe ? "right-0" : "left-0"
                                    } bg-white dark:bg-slate-700 shadow-lg rounded-lg p-2 z-50`}>

                                        <button
                                            className="block w-full text-left px-3 py-1 hover:bg-gray-200 dark:hover:bg-slate-600 text-sm"
                                            onClick={() => {
                                                handleDeleteForMe(msg._id);
                                            }}
                                        >
                                            Delete for Me
                                        </button>

                                        <button
                                            className="block w-full text-left px-3 py-1 hover:bg-gray-200 dark:hover:bg-slate-600 text-sm"
                                            onClick={() => {
                                                handleDeleteForEveryone(msg._id);
                                            }}
                                        >
                                            Delete for Everyone
                                        </button>

                                        <button
                                            className="block w-full text-left px-3 py-1 text-red-500 text-sm"
                                            onClick={() => setDeleteMenu(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Reaction Button */}
                                <div className="mt-1 flex justify-end relative">
                                    <button
                                        onClick={() =>
                                            setActiveReaction(activeReaction === msg._id ? null : msg._id)
                                        }
                                        className="text-sm opacity-70 hover:opacity-100"
                                    >
                                        😊
                                    </button>

                                    {activeReaction === msg._id && (
                                        <div className={`absolute -top-12 ${
                                            isMe ? "right-0" : "left-0"
                                        } bg-slate-700 px-2 py-1 rounded-full flex gap-2 shadow-lg z-50`}>
                                            {emojis.map((e) => (
                                                <span
                                                    key={e}
                                                    className="cursor-pointer text-lg hover:scale-125 transition"
                                                    onClick={() => {
                                                        socket.emit("message:react", {
                                                            messageId: msg._id,
                                                            userId: me._id,
                                                            emoji: e,
                                                        });
                                                        setActiveReaction(null);
                                                    }}
                                                >
                                                    {e}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Time */}
                                <div className="text-xs text-right mt-1 opacity-70 flex items-center justify-end gap-1">
                                    {formatDate(msg.createdAt)}

                                    {isMe && (
                                        <span>
                                            {msg.seenBy?.length > 1 ? (
                                                <span className="text-blue-500">✓✓</span>
                                            ) : msg.status === "delivered" ? (
                                                <span className="text-gray-400">✓✓</span>
                                            ) : (
                                                <span className="text-gray-400">✓</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ✅ Reactions Display (CORRECT PLACE) */}
                            {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    {Object.entries(
                                        msg.reactions.reduce((acc, r) => {
                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ).map(([emoji, count]) => (
                                        <span
                                            key={emoji}
                                            className="bg-slate-700 px-2 py-1 rounded-full text-xs"
                                        >
                                            {emoji} {count}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div ref={bottomRef} />

            {Object.entries(typingUsers)
                .filter(([id, isTyping]) => isTyping && id !== me._id)
                .map(([userId]) => (
                    <div
                        key={userId}
                        className="text-sm text-gray-400 mb-1 px-2"
                    >
                        {getUserName(userId)} is typing...
                    </div>
                ))}

            <input
                type="file"
                id="fileInput"
                hidden
                onChange={(e) => {
                    const selected = e.target.files[0];
                    setFile(selected);

                    if (selected && selected.type.startsWith("image")) {
                        setPreview(URL.createObjectURL(selected));
                    } else {
                        setPreview(null);
                    }
                }}
            />

            <div
                className="mt-3 border-2 border-dashed border-slate-600 p-2 rounded-xl"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >

                <div className="border-2 border-dashed border-gray-400 dark:border-gray-600 p-3 rounded-xl text-center text-gray-600 dark:text-gray-400">
                    Drag & Drop file here or use 📎
                </div>

                {/* Preview */}
                {file && (
                    <div className="bg-slate-700 p-3 rounded-lg mb-2 flex items-center gap-3">
                        {preview ? (
                            <img src={preview} className="w-16 h-16 object-cover rounded" />
                        ) : (
                            <span className="text-sm text-white">{file.name}</span>
                        )}

                        <button
                            onClick={() => {
                                setFile(null);
                                setPreview(null);
                            }}
                            className="text-red-400"
                        >
                            ✖
                        </button>
                    </div>
                )}

                {/* Input Bar */}
                <div className="flex gap-2 items-center bg-slate-800 p-2 rounded-xl">

                    <label htmlFor="fileInput" className="cursor-pointer text-xl px-2">
                        📎
                    </label>

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
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent px-3 py-2 outline-none text-white"
                    />

                    <button
                        onClick={sendMessage}
                        className="bg-green-500 px-5 py-2 rounded-lg text-white"
                    >
                        Send
                    </button>
                </div>

            </div>
        </section>
    );
};
