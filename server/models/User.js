const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ["farmer", "customer", "admin"],
            required: [true, "Role is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        mfaEnabled: {
            type: Boolean,
            default: false,
        },
        mfaMethod: {
            type: String,
            enum: ["email", "authenticator", "app", null],
            default: null,
        },
        mfaSecret: {
            type: String,
            default: null,
        },
        mfaTempSecret: {
            type: String,
            default: null,
        },
        otp: {
            type: String,
            default: null,
        },
        otpExpiry: {
            type: Date,
            default: null,
        },
        otpAttempts: {
            type: Number,
            default: 0,
        },
        otpSentAt: {
            type: Date,
            default: null,
        },
        mfaVerifyAttempts: {
            type: Number,
            default: 0,
        },
        mfaLockedUntil: {
            type: Date,
            default: null,
        },
        passwordResetToken: {
            type: String,
            default: null,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
        },
        passwordResetSentAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
