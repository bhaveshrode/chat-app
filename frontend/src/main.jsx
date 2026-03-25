import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatPage } from './pages/ChatPage';
import { ThemeProvider } from './context/ThemeContext';
import './styles/app.css';

import AuthPage from "./pages/AuthPage";
import { setAuthToken } from "./services/api";

function App() {
    return <AuthPage />;
}

const token = localStorage.getItem("token");
if (token) setAuthToken(token);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
