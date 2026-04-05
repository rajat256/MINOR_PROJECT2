const express = require("express");
const router = express.Router();
const {
    placeOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getOrders,
    updateOrderStatus,
    getOrderById,
    createClaim,
    getOrderClaims,
    getClaimById,
    updateClaimStatus,
    cancelOrder,
} = require("../controllers/orderController");
const { protect, farmerOnly, customerOnly } = require("../middleware/authMiddleware");

router.post("/", protect, customerOnly, placeOrder);
router.post("/payment/razorpay/order", protect, customerOnly, createRazorpayOrder);
router.post("/payment/razorpay/verify", protect, customerOnly, verifyRazorpayPayment);
router.get("/", protect, getOrders);
router.post("/:id/claims", protect, customerOnly, createClaim);
router.get("/:id/claims", protect, getOrderClaims);
router.get("/:id/claims/:claimId", protect, getClaimById);
router.put("/:id/claims/:claimId/status", protect, farmerOnly, updateClaimStatus);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, farmerOnly, updateOrderStatus);
router.put("/:id/cancel", protect, customerOnly, cancelOrder);

module.exports = router;
