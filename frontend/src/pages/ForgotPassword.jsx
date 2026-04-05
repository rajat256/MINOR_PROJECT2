import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { requestPasswordReset } from "../services/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const res = await requestPasswordReset({ email: email.trim() });
            setSuccess(res.data?.message || "If an account exists, a reset link has been sent.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to process request. Please try again.");
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
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                                🔐
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
                            <p className="text-gray-500 mt-1.5 text-sm">
                                Enter your email and we will send you a secure password reset link.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="input-field"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 text-base"
                            >
                                {loading ? "Sending reset link..." : "Send Reset Link"}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            Remembered your password?{" "}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Go back to login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
