const express = require("express");
const router = express.Router();
const { protect, customerOnly } = require("../middleware/authMiddleware");
const { createReview, getFarmerReviews } = require("../controllers/reviewController");

router.post("/", protect, customerOnly, createReview);
router.get("/farmer/:farmerId", getFarmerReviews);

module.exports = router;
