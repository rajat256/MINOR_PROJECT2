const express = require("express");
const router = express.Router();
const { protect, farmerOnly, customerOnly } = require("../middleware/authMiddleware");
const {
    createRequest,
    getRequests,
    updateRequestStatus,
} = require("../controllers/requestController");

router.post("/", protect, customerOnly, createRequest);
router.get("/", protect, getRequests);
router.put("/:id/status", protect, farmerOnly, updateRequestStatus);

module.exports = router;
