import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import './styles/app.css';

import AuthPage from "./pages/AuthPage";
import { setAuthToken } from "./services/api";
import { useState, useEffect } from "react";
import { ChatPage } from "./pages/ChatPage";

function App(){
    const [token, setToken] = useState(localStorage.getItem("token"));

    useEffect(()=>{
        const t = localStorage.getItem("token");
        setToken(t);
    }, []);

    return token ? <ChatPage /> : <AuthPage onLogin={setToken}/>;
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
