const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getOrderMessages, postOrderMessage } = require("../controllers/chatController");

router.get("/:orderId/messages", protect, getOrderMessages);
router.post("/:orderId/messages", protect, postOrderMessage);

module.exports = router;
