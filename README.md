# Real-Time Chat Application (JavaScript Stack)

This starter gives you a production-style foundation for a **real-time chat app** using JavaScript end-to-end:

- **Frontend:** React + Vite + Socket.IO client
- **Backend:** Node.js + Express + Socket.IO
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (signup/login)

## Features Covered

1. **Authentication**
   - Signup/Login endpoints
   - JWT-based session handling

2. **Messaging**
   - Real-time 1-to-1 chat support
   - Group chat data model
   - Message timestamps (`createdAt`)

3. **Real-time UX**
   - Typing indicator
   - Online/offline status events
   - Read receipts (`seenBy` -> ✔✔)

4. **Extra**
   - File/image sharing (`multer` uploads)
   - Message search endpoint
   - Dark/light mode toggle in frontend

## Project Structure

```text
backend/
  src/
    config/
    middleware/
    models/
    routes/
    sockets/
    server.js
frontend/
  src/
    components/
    context/
    pages/
    services/
```

## Quick Start

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend .env Example

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chat_app
JWT_SECRET=super-secret
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

## Suggested Next Improvements

- Add refresh tokens and secure cookie strategy
- Add role-based group admin controls
- Add optimistic UI and message retry queue
- Add tests (Jest + Supertest + React Testing Library)
- Add Redis adapter for horizontal Socket.IO scaling
