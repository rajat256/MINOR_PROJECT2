import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { resetPasswordWithToken } from "../services/api";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token) {
            setError("Reset token is missing. Please request a new link.");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Password and confirmation do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await resetPasswordWithToken(token, {
                password: form.password,
                confirmPassword: form.confirmPassword,
            });
            setSuccess(res.data?.message || "Password reset successful.");
            setForm({ password: "", confirmPassword: "" });
            setTimeout(() => navigate("/login"), 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Reset link is invalid or expired.");
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
                                🛡️
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                            <p className="text-gray-500 mt-1.5 text-sm">
                                Enter and confirm your new password to secure your account.
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input-field"
                                    placeholder="Minimum 6 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input-field"
                                    placeholder="Repeat new password"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            Back to{" "}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
