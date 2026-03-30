import { useState } from "react";
import { loginUser, registerUser, setAuthToken } from "../services/api";
import { socket } from "../services/socket";

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = isLogin
            ? await loginUser(form)
            : await registerUser(form);

        if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("me", JSON.stringify(data.user));
            setAuthToken(data.token);
            onLogin(data.token);
            socket.auth = { token: data.token };
            socket.connect();
        } else alert(data.message || "Error");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {isLogin ? "Login" : "Register"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none"
                            placeholder="Name"
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    )}

                    <input
                        className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none"
                        placeholder="Email"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />

                    <input
                        type="password"
                        className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none"
                        placeholder="Password"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg">
                        {isLogin ? "Login" : "Register"}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-4 text-sm text-gray-400 hover:text-white w-full"
                >
                    Switch to {isLogin ? "Register" : "Login"}
                </button>
            </div>
        </div>
    );
}