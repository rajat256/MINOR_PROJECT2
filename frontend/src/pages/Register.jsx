import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const Register = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer",
        phone: "",
        location: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (form.password !== form.confirmPassword) {
            return setError("Passwords do not match");
        }
        if (form.password.length < 6) {
            return setError("Password must be at least 6 characters");
        }
        setLoading(true);
        try {
            const { confirmPassword, ...data } = form;
            const user = await register(data);
            if (user.role === "farmer") navigate("/farmer/dashboard");
            else navigate("/customer/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-bg">
            <Navbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
                <div className="w-full max-w-lg animate-fade-in-up">
                    <div className="card p-8 shadow-lg shadow-slate-200/50">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                                🌱
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Join FarmFresh</h1>
                            <p className="text-gray-500 mt-1.5 text-sm">Create your account to get started</p>
                        </div>

                        {error && (
                            <div className="mb-5 bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Role Toggle */}
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                            {["customer", "farmer"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setForm({ ...form, role: r })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${form.role === r
                                            ? "bg-white text-primary-700 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {r === "farmer" ? "👨‍🌾 Farmer" : "🛒 Customer"}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                                    <input id="reg-name" name="name" type="text" placeholder="John Doe" required className="input-field" value={form.name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                                    <input id="reg-email" name="email" type="email" placeholder="you@example.com" required className="input-field" value={form.email} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                                    <input id="reg-password" name="password" type="password" placeholder="Min 6 chars" required className="input-field" value={form.password} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                                    <input id="reg-confirm-password" name="confirmPassword" type="password" placeholder="Repeat password" required className="input-field" value={form.confirmPassword} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                    <input id="reg-phone" name="phone" type="tel" placeholder="+91 XXXXXXXXXX" className="input-field" value={form.phone} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location / City</label>
                                    <input id="reg-location" name="location" type="text" placeholder="e.g. Mumbai" className="input-field" value={form.location} onChange={handleChange} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 text-base mt-2"
                                id="register-submit"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Creating account…
                                    </span>
                                ) : `Create ${form.role === "farmer" ? "Farmer" : "Customer"} Account`}
                            </button>
                        </form>

                        <div className="mt-6 relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">OR</span></div>
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
