# 💬 Real-Time Chat Application

A full-stack real-time chat application inspired by WhatsApp, built using modern web technologies with features like private messaging, online presence, typing indicators, message status (sent/delivered/seen), and message deletion.

---

## 🚀 Features

### 🔐 Authentication
- JWT-based authentication
- Secure login system
- Protected routes

### 💬 Messaging
- Real-time messaging using Socket.IO
- Private one-to-one chat system
- Persistent chat history (MongoDB)

### 👀 Message Status
- Sent ✔
- Delivered ✔✔
- Seen ✔✔ (blue ticks)

### ⌨️ Typing Indicator
- Shows "{username} is typing..."
- Real-time updates using WebSockets

### 🟢 Online Presence
- Shows online/offline status
- Real-time updates across users

### 🗑️ Message Deletion
- Delete for Me
- Delete for Everyone
- Synced across users

### 🧹 Chat Management
- Create new chats
- Delete chats (with confirmation popup)

### 📅 Date & Time
- Smart timestamps (Today, Yesterday, Date format)
- Message grouping by date

### 🎨 UI/UX
- Dark/Light mode toggle
- Sidebar with chat list
- User list with online indicators

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Socket.IO Client
- Context API (Theme Management)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO

### Other
- JWT Authentication
- REST APIs
- WebSockets

---

## 📂 Project Structure
```text
chat-app/
    backend/
        src/
            config/
                db.js
                env.js
            middleware/
                auth.js
            models/
                Chat.js
                Message.js
                User.js
            routes/
                auth.routes.js
                chat.routes.js
                message.routes.js
                user.routes.js
            sockets/
                registerSocketHandlers.js
            utils/
                jwt.js
            app.js
            server.js
        .env
        .env.example
        package.json
    frontend/
        src/
            components/
                ChatWindow.jsx
            context/
                ThemeContext.jsx
            pages/
                AuthPage.jsx
                ChatPage.jsx
            services/
                api.js
                socket.js
            styles/
                app.css
            main.jsx
        index.html
        package.json
        vite.config.js
    README.md
    
```

## ⚙️ Installation

### 1. Clone the repo

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

Create `.env` in backend:

```env
PORT=5000
MONGO_URI=mongodb://chatapp:chatapp123@ac-drpkqrj-shard-00-00.vyj4lgo.mongodb.net:27017,ac-drpkqrj-shard-00-01.vyj4lgo.mongodb.net:27017,ac-drpkqrj-shard-00-02.vyj4lgo.mongodb.net:27017/chat_app?ssl=true&replicaSet=atlas-njq079-shard-0&authSource=admin&retryWrites=true&w=majority
JWT_SECRET=super-secret
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

---

## 🧪 Testing

- Open two browser tabs
- Login with different users
- Start chatting in real-time

---

## 📌 Future Improvements

- Unread message counter 🔴
- Group chats
- File/image sharing
- Push notifications
- Message reactions

---

## 👨‍💻 Author

Bhavesh Rode
