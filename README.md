# 💬 Real-Time Chat Application (WhatsApp-Inspired)

A full-stack real-time chat application inspired by WhatsApp, built using modern web technologies.  
Supports messaging, file sharing, emoji reactions, typing indicators, drag & drop uploads, and more.

---

## 🚀 Features

### 🔐 Authentication
- JWT-based secure authentication
- Protected routes
- Persistent user sessions

---

### 💬 Real-Time Messaging
- One-to-one private chats
- Real-time communication using Socket.IO
- Persistent chat history (MongoDB)

---

### 📂 File & Media Sharing
- Upload files & images (📎 + Drag & Drop)
- Image preview inside chat
- Text file preview inside chat
- File name display with preview
- Download files directly to system (no new tab)
- Multer-based file handling

---

### 😊 Emoji Reactions
- React to messages with emojis ❤️😂👍😮😢
- Real-time updates
- Reaction count aggregation

---

### ⌨️ Typing Indicator
- Shows: **"{username} is typing..."**
- Real-time typing updates via WebSockets

---

### 🟢 Online Presence
- Live online/offline status
- Real-time updates across users

---

### 🗑️ Message Deletion
- Delete for Me
- Delete for Everyone
- Instant sync across users

---

### 🧹 Chat Management
- Create chats
- Delete chats
- Sidebar with chat previews

---

### 📅 Smart Date & Time
- Today / Yesterday formatting
- Full date for older messages
- Message timestamps

---

### 🎨 UI/UX
- Modern WhatsApp-style UI
- Dark / Light mode toggle
- Scrollable chat area
- Drag & Drop upload UI
- Responsive layout (desktop optimized)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
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
- Multer (File Upload)

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
- Send messages in real-time
- Test:
  - File upload
  - Drag & drop
  - Reactions
  - Typing indicator

---

## 📌 Future Improvements
- Fix emoji toggle (add/remove reaction)
- Message editing ✏️
- Notifications 🔔
- Mobile responsiveness 📱
- Group chats 👥
- Read receipts ✔✔
- Cloud storage (AWS S3 / Cloudinary)
  
---

## 👨‍💻 Author

Bhavesh Rode