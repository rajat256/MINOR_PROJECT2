const nodemailer = require("nodemailer");
const crypto = require("crypto");

const EMAIL_OTP_EXPIRY_MS = 5 * 60 * 1000;
const EMAIL_OTP_RESEND_MS = 60 * 1000;

let transporter;

const isSmtpConfigured = () => {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getTransporter = () => {
    if (transporter) return transporter;

    if (!isSmtpConfigured()) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
};

const generateOtp = () => {
    const plainOtp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(plainOtp).digest("hex");
    return { plainOtp, otpHash };
};

const isOtpResendBlocked = (otpSentAt) => {
    if (!otpSentAt) return false;
    return Date.now() - new Date(otpSentAt).getTime() < EMAIL_OTP_RESEND_MS;
};

const verifyOtpHash = (otp, hashedOtp) => {
    const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    return otpHash === hashedOtp;
};

const buildOtpEmailTemplate = (otp) => {
    return {
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        html: `
            <div style="font-family:Segoe UI, Roboto, Arial, sans-serif; max-width:560px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
                <h2 style="margin:0 0 8px 0; color:#0f172a;">Your OTP Code</h2>
                <p style="margin:0 0 16px 0; color:#475569; font-size:14px;">
                    Use the verification code below to continue.
                </p>
                <div style="margin:0 0 16px 0; padding:14px 18px; border-radius:10px; background:#ecfeff; border:1px solid #a5f3fc; text-align:center;">
                    <span style="font-size:28px; font-weight:700; letter-spacing:5px; color:#155e75;">${otp}</span>
                </div>
                <p style="margin:0 0 8px 0; color:#334155; font-size:14px;">
                    This code expires in <strong>5 minutes</strong>.
                </p>
                <p style="margin:0; color:#64748b; font-size:12px;">
                    If you did not request this, you can ignore this email.
                </p>
            </div>
        `,
    };
};

const buildPasswordResetEmailTemplate = (resetLink) => {
    return {
        subject: "Reset your FarmFresh password",
        text: `Reset your password using this link: ${resetLink}. This link expires in 15 minutes.`,
        html: `
            <div style="font-family:Segoe UI, Roboto, Arial, sans-serif; max-width:560px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
                <h2 style="margin:0 0 8px 0; color:#0f172a;">Reset your password</h2>
                <p style="margin:0 0 16px 0; color:#475569; font-size:14px;">
                    We received a request to reset your FarmFresh account password.
                </p>
                <a href="${resetLink}" style="display:inline-block; padding:12px 18px; border-radius:10px; background:#0891b2; color:#ffffff; text-decoration:none; font-weight:600;">
                    Reset Password
                </a>
                <p style="margin:16px 0 8px 0; color:#334155; font-size:14px;">
                    This link expires in <strong>15 minutes</strong>.
                </p>
                <p style="margin:0; color:#64748b; font-size:12px; word-break:break-word;">
                    If the button does not work, copy and paste this URL into your browser: ${resetLink}
                </p>
            </div>
        `,
    };
};

const sendOtpEmail = async ({ to, otp }) => {
    const mail = buildOtpEmailTemplate(otp);

    const mailer = getTransporter();
    if (!mailer) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("SMTP is not configured. Unable to send OTP email.");
        }

        console.info(`[MFA][EMAIL][DEV] SMTP not configured. OTP generated for ${to}.`);
        return {
            delivery: "dev",
            message: "SMTP not configured. OTP generated for development mode.",
            debugOtp: otp,
        };
    }

    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        });

        console.info(`[MFA][EMAIL] OTP sent successfully to ${to}.`);
        return {
            delivery: "email",
            message: "OTP sent to your email",
        };
    } catch (error) {
        console.error(`[MFA][EMAIL] Failed to send OTP to ${to}: ${error.message}`);
        if (process.env.NODE_ENV === "production") {
            throw new Error("Failed to send OTP email. Please try again.");
        }

        return {
            delivery: "dev",
            message: "SMTP delivery failed in development mode. OTP generated for local testing.",
            debugOtp: otp,
        };
    }
};

const sendPasswordResetEmail = async ({ to, resetLink }) => {
    const mail = buildPasswordResetEmailTemplate(resetLink);

    const mailer = getTransporter();
    if (!mailer) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("SMTP is not configured. Unable to send password reset email.");
        }

        console.info(`[AUTH][RESET][DEV] SMTP not configured. Reset link generated for ${to}.`);
        return {
            delivery: "dev",
            message: "SMTP not configured. Reset link generated for development mode.",
            debugResetLink: resetLink,
        };
    }

    try {
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        });

        console.info(`[AUTH][RESET] Password reset email sent to ${to}.`);
        return {
            delivery: "email",
            message: "Password reset link sent to your email",
        };
    } catch (error) {
        console.error(`[AUTH][RESET] Failed to send password reset email to ${to}: ${error.message}`);
        if (process.env.NODE_ENV === "production") {
            throw new Error("Failed to send password reset email. Please try again.");
        }

        return {
            delivery: "dev",
            message: "SMTP delivery failed in development mode. Reset link generated for local testing.",
            debugResetLink: resetLink,
        };
    }
};

module.exports = {
    EMAIL_OTP_EXPIRY_MS,
    EMAIL_OTP_RESEND_MS,
    generateOtp,
    isOtpResendBlocked,
    verifyOtpHash,
    sendOtpEmail,
    sendPasswordResetEmail,
};
