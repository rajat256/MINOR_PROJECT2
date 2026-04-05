import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const Login = () => {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role === "farmer") navigate("/farmer/dashboard");
            else navigate("/customer/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-bg">
            <Navbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="card p-8 shadow-lg shadow-slate-200/50">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                                🌿
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
                            <p className="text-gray-500 mt-1.5 text-sm">Sign in to your FarmFresh account</p>
                        </div>

                        {error && (
                            <div className="mb-5 bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="input-field"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="input-field"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                                <div className="mt-2 text-right">
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full py-3 text-base"
                                disabled={loading}
                                id="login-submit"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Signing in…
                                    </span>
                                ) : "Sign In"}
                            </button>
                        </form>

                        <div className="mt-6 relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">OR</span></div>
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Create one here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
