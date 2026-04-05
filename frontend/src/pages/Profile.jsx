import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import {
    updateProfile,
    getSecuritySettings,
    setupMfa,
    verifyAuthenticatorMfa,
    sendEmailMfaOtp,
    verifyEmailMfaOtp,
    disableMfa,
    changePassword,
} from "../services/api";
import { Calendar, Mail, MapPin, Phone, ShieldCheck, UserRound, Moon, Sun, Settings, KeyRound, Smartphone, Mail as MailIcon } from "lucide-react";

const Profile = () => {
    const { user, updateUser } = useAuth();
    
    const isFarmer = user?.role === "farmer";
    const isAdmin = user?.role === "admin";
    const hasSidebarLayout = isFarmer || user?.role === "customer";

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        location: user?.location || "",
    });
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("farmfresh_theme") === "dark" || document.documentElement.classList.contains("dark"));
    const [activeSetting, setActiveSetting] = useState("profile");
    const [selectedMfaMethod, setSelectedMfaMethod] = useState("email");
    const [currentMfaMethod, setCurrentMfaMethod] = useState(null);
    const [hasPendingAuthenticatorSetup, setHasPendingAuthenticatorSetup] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaMessage, setMfaMessage] = useState("");
    const [appQrCode, setAppQrCode] = useState("");
    const [appManualKey, setAppManualKey] = useState("");
    const [appOtp, setAppOtp] = useState("");
    const [emailOtp, setEmailOtp] = useState("");
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [devEmailOtp, setDevEmailOtp] = useState("");
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("farmfresh_theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("farmfresh_theme", "light");
        }
    }, [darkMode]);

    useEffect(() => {
        const fetchSecurity = async () => {
            try {
                const { data } = await getSecuritySettings();
                setMfaEnabled(Boolean(data.mfaEnabled));
                setCurrentMfaMethod(data.mfaMethod || null);
                setSelectedMfaMethod(data.mfaMethod || "email");
                setHasPendingAuthenticatorSetup(Boolean(data.hasPendingAuthenticatorSetup));
            } catch (err) {
                console.error(err);
                setMfaMessage(err.response?.data?.message || "Could not load security settings.");
            }
        };
        fetchSecurity();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data } = await updateProfile(form);
            updateUser(data);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSetupMfa = async () => {
        setMfaLoading(true);
        setMfaMessage("");
        try {
            if (selectedMfaMethod === "authenticator") {
                const { data } = await setupMfa({ method: "authenticator" });
                setAppQrCode(data.qrCode || "");
                setAppManualKey(data.manualKey || "");
                setHasPendingAuthenticatorSetup(true);
                setMfaMessage(data.message || "Scan the QR code and verify OTP to enable MFA.");
            } else {
                const { data } = await sendEmailMfaOtp();
                setEmailOtpSent(true);
                setDevEmailOtp(data.debugOtp || "");
                setMfaMessage(data.message || "OTP sent to your email.");
            }
        } catch (err) {
            setMfaMessage(err.response?.data?.message || "Failed to configure MFA. Please check that the server is running and try again.");
        } finally {
            setMfaLoading(false);
        }
    };

    const handleVerifyAuthenticator = async () => {
        if (!/^\d{6}$/.test(appOtp)) {
            setMfaMessage("OTP must be a 6-digit code.");
            return;
        }

        setMfaLoading(true);
        setMfaMessage("");
        try {
            const { data } = await verifyAuthenticatorMfa({ otp: appOtp });
            setMfaEnabled(Boolean(data.mfaEnabled));
            setCurrentMfaMethod(data.mfaMethod || "authenticator");
            setAppOtp("");
            setAppQrCode("");
            setAppManualKey("");
            setHasPendingAuthenticatorSetup(false);
            setMfaMessage(data.message || "Authenticator MFA enabled successfully.");
        } catch (err) {
            setMfaMessage(err.response?.data?.message || "Invalid or expired OTP.");
        } finally {
            setMfaLoading(false);
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (!/^\d{6}$/.test(emailOtp)) {
            setMfaMessage("OTP must be a 6-digit code.");
            return;
        }

        setMfaLoading(true);
        setMfaMessage("");
        try {
            const { data } = await verifyEmailMfaOtp({ otp: emailOtp });
            setMfaEnabled(Boolean(data.mfaEnabled));
            setCurrentMfaMethod(data.mfaMethod || "email");
            setEmailOtp("");
            setEmailOtpSent(false);
            setDevEmailOtp("");
            setMfaMessage(data.message || "Email MFA enabled successfully.");
        } catch (err) {
            setMfaMessage(err.response?.data?.message || "Invalid or expired OTP.");
        } finally {
            setMfaLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!window.confirm("Disable MFA for your account?")) return;
        setMfaLoading(true);
        setMfaMessage("");
        try {
            const { data } = await disableMfa();
            setMfaEnabled(Boolean(data.mfaEnabled));
            setCurrentMfaMethod(data.mfaMethod || null);
            setHasPendingAuthenticatorSetup(false);
            setAppQrCode("");
            setAppManualKey("");
            setAppOtp("");
            setEmailOtp("");
            setEmailOtpSent(false);
            setDevEmailOtp("");
            setMfaMessage(data.message || "MFA disabled successfully.");
        } catch (err) {
            setMfaMessage(err.response?.data?.message || "Failed to disable MFA.");
        } finally {
            setMfaLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage("");

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordMessage("Please fill all password fields.");
            setPasswordLoading(false);
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage("New password and confirmation do not match.");
            setPasswordLoading(false);
            return;
        }

        try {
            const { data } = await changePassword(passwordForm);
            setPasswordMessage(data.message || "Password updated successfully.");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setPasswordMessage(err.response?.data?.message || "Failed to update password.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const fields = [
        { label: "Full Name", value: user?.name, icon: UserRound, key: "name", type: "text" },
        { label: "Email Address", value: user?.email, icon: Mail, readOnly: true },
        { label: "Phone Number", value: user?.phone || "Not provided", icon: Phone, key: "phone", type: "tel" },
        { label: "Location", value: user?.location || "Not provided", icon: MapPin, key: "location", type: "text" },
        { label: "Member Since", value: new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", { year: "numeric", month: "long" }), icon: Calendar, readOnly: true },
    ];

    const roleBadgeClass = isAdmin
        ? "bg-red-50 text-red-700 border-red-200"
        : isFarmer
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-sky-50 text-sky-700 border-sky-200";

    const roleLabel = isAdmin ? "Administrator" : isFarmer ? "Farmer" : "Customer";
    const userInitial = (user?.name || "U").charAt(0).toUpperCase();

    const content = (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 [font-family:'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]">
            <div className="max-w-6xl">
                <div className="mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-slate-500">Account Center</p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mt-1 tracking-tight">Profile & Security</h1>
                    <p className="text-slate-600 mt-2">Manage your identity, security options, and password in one place.</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="btn-secondary text-sm px-4 py-2.5 rounded-xl"
                    >
                        Edit Profile
                    </button>
                )}
                {error && (
                    <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                        {error}
                    </div>
                )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1.5 bg-white/80 border border-slate-200 rounded-2xl mb-6 shadow-sm backdrop-blur">
                    <button
                        type="button"
                        onClick={() => setActiveSetting("profile")}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                            activeSetting === "profile"
                                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                                : "bg-transparent border-transparent text-slate-700 hover:bg-white/70"
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm md:text-base font-medium">Profile</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSetting("mfa")}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                            activeSetting === "mfa"
                                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                                : "bg-transparent border-transparent text-slate-700 hover:bg-white/70"
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm md:text-base font-medium">Multi-Factor Auth</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSetting("password")}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                            activeSetting === "password"
                                ? "bg-white border-slate-300 text-slate-900 shadow-sm"
                                : "bg-transparent border-transparent text-slate-700 hover:bg-white/70"
                        }`}
                    >
                        <KeyRound className="w-4 h-4" />
                        <span className="text-sm md:text-base font-medium">Change Password</span>
                    </button>
                </div>

                {activeSetting === "profile" && (
                <>
                <div className="card mb-6 border border-slate-200 rounded-3xl bg-white/95 backdrop-blur shadow-md shadow-slate-200/60">
                    <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-900/20">
                                {userInitial}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight truncate tracking-tight">{user?.name}</h2>
                                        <p className="text-base sm:text-lg text-slate-600 mt-1 break-all font-normal">{user?.email}</p>
                                    </div>
                                    <span className={`w-fit text-sm font-medium px-3 py-1.5 rounded-full border ${roleBadgeClass}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                {fields.map((f, i) => (
                                    <div key={i} className={f.readOnly ? "opacity-60" : ""}>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                                        {f.readOnly ? (
                                            <input type="text" readOnly value={f.value} className="input-field bg-slate-50 cursor-not-allowed text-sm" />
                                        ) : (
                                            <input 
                                                type={f.type} 
                                                value={form[f.key]} 
                                                onChange={e => setForm({...form, [f.key]: e.target.value})}
                                                className="input-field text-sm" 
                                                required={f.key === "name"}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => { setIsEditing(false); setForm({name: user.name, phone: user.phone||"", location: user.location||""}); }} className="btn-secondary flex-1 py-2.5">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {fields.map(({ label, value, icon: Icon }, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl hover:bg-slate-100/80 transition-colors">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <Icon className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                                        <p className="font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>

                <div className="card p-6 border border-slate-200 rounded-2xl bg-white/95 backdrop-blur shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 text-2xl">Account Information</h3>
                    <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 text-sm text-cyan-800">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Your account is secured with JWT authentication.
                        </p>
                        <p className="text-cyan-700">Your password is encrypted using bcrypt hashing.</p>
                    </div>
                    {isAdmin && (
                        <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-700">
                            <p className="font-semibold">You are an Administrator.</p>
                            <p className="text-violet-600 mt-0.5">You have full access to platform analytics, user management, and moderation tools.</p>
                        </div>
                    )}
                    {isFarmer && (
                        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                            <p className="font-semibold">You are registered as a Farmer.</p>
                            <p className="text-amber-600 mt-0.5">You can list vegetables, manage products, and receive orders from customers.</p>
                        </div>
                    )}
                    {!isFarmer && !isAdmin && (
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                            <p className="font-semibold">You are registered as a Customer.</p>
                            <p className="text-blue-600 mt-0.5">You can browse vegetables, add to cart, and place orders from local farmers.</p>
                        </div>
                    )}
                </div>
                <div className="card p-6 border border-slate-200 dark:border-gray-700 rounded-2xl bg-white/95 dark:bg-gray-800 backdrop-blur mt-8 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-2xl flex items-center gap-2">
                        <Settings className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                        Preferences & Settings
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-700 rounded-xl">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                    {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-white">Dark Mode</p>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">Toggle dark theme across the application</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${darkMode ? 'bg-primary-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
                </>
                )}

                {activeSetting === "mfa" && (
                    <div className="space-y-6">
                        <div className="card p-5 border border-slate-200 rounded-2xl bg-white/95 backdrop-blur">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-slate-700 mt-0.5" />
                                <div>
                                    <h4 className="text-lg md:text-xl font-semibold text-slate-900">{mfaEnabled ? "MFA is enabled" : "MFA is not enabled"}</h4>
                                    <p className="text-sm md:text-base text-slate-500 mt-1">{mfaEnabled ? `Current method: ${currentMfaMethod === "authenticator" ? "Authenticator App" : "Email OTP"}` : "Set up multi-factor authentication to secure your account."}</p>
                                </div>
                            </div>
                            {mfaEnabled && (
                                <button
                                    type="button"
                                    onClick={handleDisableMfa}
                                    disabled={mfaLoading}
                                    className="mt-4 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                                >
                                    Disable MFA
                                </button>
                            )}
                        </div>

                        <div className="card p-6 md:p-7 border border-slate-200 rounded-2xl bg-white/95 backdrop-blur">
                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Setup Multi-Factor Authentication</h3>
                            <p className="text-sm md:text-base text-slate-500 mb-6">Add an extra layer of security to your account with MFA. Choose between Email OTP or Authenticator App.</p>

                            <p className="text-base md:text-lg font-semibold text-slate-900 mb-4">Select MFA Method</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMfaMethod("email")}
                                    className={`w-full text-left rounded-2xl border px-5 py-4 transition-all flex items-center gap-3 ${
                                        selectedMfaMethod === "email"
                                            ? "border-primary-600 bg-white shadow-sm"
                                            : "border-slate-200 bg-slate-50 hover:bg-white"
                                    }`}
                                >
                                    <MailIcon className="w-7 h-7 text-slate-700" />
                                    <div>
                                        <p className="text-lg md:text-xl font-semibold text-slate-900">Email OTP</p>
                                        <p className="text-sm text-slate-500 mt-0.5">Get codes via email</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMfaMethod("authenticator")}
                                    className={`w-full text-left rounded-2xl border px-5 py-4 transition-all flex items-center gap-3 ${
                                        selectedMfaMethod === "authenticator"
                                            ? "border-primary-600 bg-white shadow-sm"
                                            : "border-slate-200 bg-slate-50 hover:bg-white"
                                    }`}
                                >
                                    <Smartphone className="w-7 h-7 text-slate-700" />
                                    <div>
                                        <p className="text-lg md:text-xl font-semibold text-slate-900">Authenticator App</p>
                                        <p className="text-sm text-slate-500 mt-0.5">Use Google/Microsoft Authenticator</p>
                                    </div>
                                </button>
                            </div>

                            {selectedMfaMethod === "authenticator" && (
                                <div className="space-y-4">
                                    <button onClick={handleSetupMfa} disabled={mfaLoading} className="w-full btn-primary py-3 text-sm md:text-base font-semibold normal-case disabled:opacity-60 disabled:cursor-not-allowed">
                                        {mfaLoading ? "Preparing..." : (hasPendingAuthenticatorSetup || appQrCode ? "Regenerate QR" : "Generate QR Code")}
                                    </button>

                                    {(appQrCode || hasPendingAuthenticatorSetup) && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            {appQrCode ? (
                                                <img src={appQrCode} alt="MFA QR Code" className="w-44 h-44 mx-auto rounded-lg border border-slate-200 bg-white p-2" />
                                            ) : (
                                                <p className="text-sm text-slate-600">QR code is already generated. You can regenerate it if needed.</p>
                                            )}
                                            {appManualKey && (
                                                <div className="mt-3">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Manual Secret Key</p>
                                                    <p className="mt-1 p-2 rounded-lg bg-white border border-slate-200 text-sm font-mono break-all text-slate-800">{appManualKey}</p>
                                                </div>
                                            )}
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={appOtp}
                                                    onChange={(e) => setAppOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="Enter 6-digit OTP"
                                                    className="input-field"
                                                />
                                                <button onClick={handleVerifyAuthenticator} disabled={mfaLoading} className="btn-secondary px-4 py-2.5 rounded-lg disabled:opacity-60">
                                                    Verify OTP
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedMfaMethod === "email" && (
                                <div className="space-y-4">
                                    <button onClick={handleSetupMfa} disabled={mfaLoading} className="w-full btn-primary py-3 text-sm md:text-base font-semibold normal-case disabled:opacity-60 disabled:cursor-not-allowed">
                                        {mfaLoading ? "Sending..." : (emailOtpSent ? "Resend Email OTP" : "Send Email OTP")}
                                    </button>

                                    {emailOtpSent && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-600 mb-2">Enter the 6-digit OTP sent to your email address.</p>
                                            {devEmailOtp && (
                                                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                    Dev OTP (SMTP not configured): <span className="font-semibold tracking-wider">{devEmailOtp}</span>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={emailOtp}
                                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="Enter 6-digit OTP"
                                                    className="input-field"
                                                />
                                                <button onClick={handleVerifyEmailOtp} disabled={mfaLoading} className="btn-secondary px-4 py-2.5 rounded-lg disabled:opacity-60">
                                                    Verify OTP
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mfaMessage && (
                                <p className={`mt-3 text-sm ${["failed", "invalid", "expired", "error", "wait", "too many"].some((k) => mfaMessage.toLowerCase().includes(k)) ? "text-red-600" : "text-emerald-600"}`}>
                                    {mfaMessage}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {activeSetting === "password" && (
                    <form onSubmit={handlePasswordChange} className="card p-6 md:p-8 border border-slate-200 rounded-2xl bg-white/95 backdrop-blur">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Change Password</h3>
                        <p className="text-slate-500 mb-6">Update your password to keep your account secure.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    className="input-field text-sm"
                                    placeholder="Enter current password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    className="input-field text-sm"
                                    placeholder="Enter new password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="input-field text-sm"
                                    placeholder="Confirm new password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                />
                            </div>
                        </div>

                        {passwordMessage && (
                            <p className={`mt-4 text-sm ${passwordMessage.toLowerCase().includes("fail") || passwordMessage.toLowerCase().includes("incorrect") || passwordMessage.toLowerCase().includes("match") ? "text-red-600" : "text-emerald-600"}`}>
                                {passwordMessage}
                            </p>
                        )}

                        <div className="mt-5 flex justify-end">
                            <button type="submit" disabled={passwordLoading} className="btn-primary px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
                                {passwordLoading ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );

    if (isAdmin) {
        return (
            <div className="page-bg min-h-screen">
                <Navbar />
                <div className="flex">
                    <AdminSidebar />
                    {content}
                </div>
            </div>
        );
    }

    if (hasSidebarLayout) {
        return (
            <div className="flex min-h-screen page-bg">
                <Sidebar />
                {content}
            </div>
        );
    }

    return (
        <div className="min-h-screen page-bg">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {content}
            </div>
        </div>
    );
};

export default Profile;
