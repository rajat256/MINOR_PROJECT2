const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/security", protect, getSecuritySettings);
router.post("/mfa/setup", protect, setupMfa);
router.post("/mfa/verify", protect, verifyMfa);
router.post("/mfa/send-otp", protect, sendMfaOtp);
router.post("/mfa/verify-otp", protect, verifyMfaOtp);
router.post("/mfa/disable", protect, disableMfa);
router.put("/change-password", protect, changePassword);

module.exports = router;
