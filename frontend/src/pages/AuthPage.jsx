import { useState } from "react";
import { registerUser, loginUser, setAuthToken } from "../services/api";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = isLogin
            ? await loginUser(form)
            : await registerUser(form);

        if (data.token) {
            localStorage.setItem("token", data.token);

            setAuthToken(data.token);

            alert("Success!");
        } else {
            alert(data.message || "Error");
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>{isLogin ? "Login" : "Register"}</h2>

            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <input
                        placeholder="Name"
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                )}

                <input
                    placeholder="Email"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <button type="submit">
                    {isLogin ? "Login" : "Register"}
                </button>
            </form>

            <button onClick={() => setIsLogin(!isLogin)}>
                Switch to {isLogin ? "Register" : "Login"}
            </button>
        </div>
    );
}
