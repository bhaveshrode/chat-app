# 💬 Real-Time Chat Application (WhatsApp Clone)

A full-stack real-time chat application inspired by WhatsApp, built using modern web technologies.  
Supports messaging, file sharing, reactions, online presence, typing indicators, and advanced chat management.

---

## 🚀 Features

### 🔐 Authentication
- JWT-based secure authentication
- Protected routes
- User session management

---

### 💬 Real-Time Messaging
- One-to-one private chats
- Real-time communication using Socket.IO
- Persistent chat history (MongoDB)

---

### 📂 File & Image Sharing
- Upload and send files/images
- Image preview inside chat
- File preview (PDF, text, etc.)
- Download support for all files
- File URLs stored in database

---

### 👀 Message Status System
- Sent ✔
- Delivered ✔✔
- Seen ✔✔ (Blue ticks)
- Real-time updates

---

### ⌨️ Typing Indicator
- Shows: **"{username} is typing..."**
- Real-time typing events using WebSockets

---

### 🟢 Online Presence
- Live online/offline status
- Sync across all users in real-time

---

### 🗑️ Message Deletion (WhatsApp Style)
- Delete for Me
- Delete for Everyone
- Synced instantly across users

---

### 🧹 Chat Management
- Create chats
- Delete chats (with confirmation popup)
- Sidebar chat preview (last message + time)

---

### 😊 Message Reactions
- React to messages with emojis ❤️😂👍😮😢
- Real-time reaction updates
- Aggregated reaction counts

---

### 📅 Smart Date & Time
- Today / Yesterday logic
- Full date for older messages
- Time shown per message

---

### 🎨 UI/UX
- Dark / Light mode toggle
- WhatsApp-style chat bubbles
- Responsive layout
- Clean sidebar + chat view

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Socket.IO Client
- Context API

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO

### Other
- JWT Authentication
- REST APIs
- WebSockets
- File Upload System (Multer)

---

## 📂 Project Structure

```text
chat-app/
    backend/
        src/
            config/
            middleware/
            models/
            routes/
            sockets/
            utils/
            app.js
            server.js

    frontend/
        src/
            components/
            context/
            pages/
            services/
            styles/
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/bhaveshrode/chat-app.git
cd chat-app
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create `.env` inside backend:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

---

## 🧪 Testing

- Open two browser windows
- Login with different users
- Start real-time chatting

---

## 📌 Future Improvements

- ✅ Unread message counter (partially implemented)
- Group chats
- Voice messages
- Message editing
- Push notifications
- Cloud file storage (AWS S3 / Cloudinary)

---

## 👨‍💻 Author

Bhavesh Rode
