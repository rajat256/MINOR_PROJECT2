const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const {
    EMAIL_OTP_EXPIRY_MS,
    EMAIL_OTP_RESEND_MS,
    generateOtp,
    isOtpResendBlocked,
    verifyOtpHash,
    sendOtpEmail,
    sendPasswordResetEmail,
} = require("../services/emailOtpService");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const EMAIL_OTP_MAX_ATTEMPTS = 5;
const APP_OTP_MAX_ATTEMPTS = 5;
const APP_OTP_LOCK_MS = 10 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

// @desc   Register a new user
// @route  POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, location } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const user = await User.create({ name, email, password, role, phone, location });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPassword = String(password);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let isPasswordValid = await user.comparePassword(normalizedPassword);

        // Backward compatibility: migrate legacy plaintext passwords to bcrypt on successful login.
        if (!isPasswordValid && user.password === normalizedPassword) {
            user.password = normalizedPassword;
            await user.save();
            isPasswordValid = true;
        }

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: "Your account is deactivated. Contact support." });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Request password reset link
// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide your email" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        // Always return a generic success message to prevent email enumeration.
        const successResponse = {
            message: "If an account with that email exists, a reset link has been sent.",
        };

        if (!user) {
            return res.json(successResponse);
        }

        if (isOtpResendBlocked(user.passwordResetSentAt)) {
            return res.status(429).json({ message: "Please wait before requesting another reset link" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetLinkBase = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetLink = `${resetLinkBase}/reset-password/${resetToken}`;

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
        user.passwordResetSentAt = new Date();
        await user.save();

        try {
            const deliveryResult = await sendPasswordResetEmail({
                to: user.email,
                resetLink,
            });

            if (deliveryResult.debugResetLink && process.env.NODE_ENV !== "production") {
                return res.json({
                    ...successResponse,
                    delivery: deliveryResult.delivery,
                    debugResetLink: deliveryResult.debugResetLink,
                });
            }
        } catch (emailError) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            user.passwordResetSentAt = null;
            await user.save();
            throw emailError;
        }

        return res.json(successResponse);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc   Reset password with token
// @route  POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({ message: "Please provide password and confirmation" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password and confirmation do not match" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Reset link is invalid or expired" });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordResetSentAt = null;
        await user.save();

        return res.json({ message: "Password reset successful. You can now sign in." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc   Get logged in user profile
// @route  GET /api/auth/me
const getMe = async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        location: req.user.location,
    });
};

// @desc   Update user profile
// @route  PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone, location } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (location !== undefined) user.location = location.trim();

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get security settings
// @route  GET /api/auth/security
const getSecuritySettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const normalizedMethod = user.mfaMethod === "app" ? "authenticator" : user.mfaMethod;

        res.json({
            mfaEnabled: Boolean(user.mfaEnabled),
            mfaMethod: normalizedMethod || null,
            hasPendingAuthenticatorSetup: Boolean(user.mfaTempSecret),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Setup authenticator MFA (generate secret + QR)
// @route  POST /api/auth/mfa/setup
const setupMfa = async (req, res) => {
    try {
        const { method } = req.body;
        if (method !== "authenticator") {
            return res.status(400).json({ message: "Invalid method for this endpoint. Use method='authenticator'." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const secret = speakeasy.generateSecret({
            name: `FarmFresh (${user.email})`,
            issuer: "FarmFresh",
            length: 20,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        user.mfaTempSecret = secret.base32;
        user.mfaEnabled = false;
        user.mfaMethod = "authenticator";
        user.mfaVerifyAttempts = 0;
        user.mfaLockedUntil = null;
        await user.save();

        res.json({
            message: "Authenticator setup initialized. Scan QR and verify OTP.",
            method: "authenticator",
            qrCode: qrCodeDataUrl,
            manualKey: secret.base32,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Verify authenticator OTP and enable MFA
// @route  POST /api/auth/mfa/verify
const verifyMfa = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!/^\d{6}$/.test(String(otp || ""))) {
            return res.status(400).json({ message: "OTP must be a 6-digit code" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
            return res.status(429).json({ message: "Too many failed attempts. Try again later." });
        }

        const secret = user.mfaTempSecret || user.mfaSecret;
        if (!secret) {
            return res.status(400).json({ message: "Authenticator setup not initialized" });
        }

        const verified = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: String(otp),
            window: 1,
        });

        if (!verified) {
            user.mfaVerifyAttempts = (user.mfaVerifyAttempts || 0) + 1;
            if (user.mfaVerifyAttempts >= APP_OTP_MAX_ATTEMPTS) {
                user.mfaLockedUntil = new Date(Date.now() + APP_OTP_LOCK_MS);
                user.mfaVerifyAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.mfaEnabled = true;
        user.mfaMethod = "authenticator";
        user.mfaSecret = secret;
        user.mfaTempSecret = null;
        user.mfaVerifyAttempts = 0;
        user.mfaLockedUntil = null;
        await user.save();

        res.json({
            message: "MFA enabled with Authenticator App",
            mfaEnabled: true,
            mfaMethod: "authenticator",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Send email OTP for MFA
// @route  POST /api/auth/mfa/send-otp
const sendMfaOtp = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (isOtpResendBlocked(user.otpSentAt)) {
            return res.status(429).json({ message: "Please wait before requesting another OTP" });
        }

        const { plainOtp, otpHash } = generateOtp();

        user.otp = otpHash;
        user.otpExpiry = new Date(Date.now() + EMAIL_OTP_EXPIRY_MS);
        user.otpAttempts = 0;
        user.otpSentAt = new Date();
        user.mfaMethod = "email";
        user.mfaEnabled = false;
        await user.save();

        const deliveryResult = await sendOtpEmail({ to: user.email, otp: plainOtp });

        const response = {
            message: deliveryResult.message,
            delivery: deliveryResult.delivery,
        };

        if (deliveryResult.debugOtp && process.env.NODE_ENV !== "production") {
            response.debugOtp = deliveryResult.debugOtp;
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Verify email OTP and enable MFA
// @route  POST /api/auth/mfa/verify-otp
const verifyMfaOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!/^\d{6}$/.test(String(otp || ""))) {
            return res.status(400).json({ message: "OTP must be a 6-digit code" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.otp || !user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
            return res.status(400).json({ message: "OTP expired. Please request a new code." });
        }

        if ((user.otpAttempts || 0) >= EMAIL_OTP_MAX_ATTEMPTS) {
            return res.status(429).json({ message: "Too many invalid attempts. Request a new OTP." });
        }

        const isValid = verifyOtpHash(otp, user.otp);
        if (!isValid) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.mfaEnabled = true;
        user.mfaMethod = "email";
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;
        user.otpSentAt = null;
        await user.save();

        res.json({
            message: "MFA enabled with Email OTP",
            mfaEnabled: true,
            mfaMethod: "email",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Disable MFA
// @route  POST /api/auth/mfa/disable
const disableMfa = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.mfaEnabled = false;
        user.mfaMethod = null;
        user.mfaSecret = null;
        user.mfaTempSecret = null;
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;
        user.otpSentAt = null;
        user.mfaVerifyAttempts = 0;
        user.mfaLockedUntil = null;
        await user.save();

        res.json({
            message: "MFA disabled successfully",
            mfaEnabled: false,
            mfaMethod: null,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Change password
// @route  PUT /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Please fill all password fields" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirmation do not match" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    getMe,
    updateProfile,
    getSecuritySettings,
    setupMfa,
    verifyMfa,
    sendMfaOtp,
    verifyMfaOtp,
    disableMfa,
    changePassword,
};
