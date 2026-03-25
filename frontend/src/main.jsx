import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatPage } from './pages/ChatPage';
import { ThemeProvider } from './context/ThemeContext';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ChatPage />
    </ThemeProvider>
  </React.StrictMode>
);
