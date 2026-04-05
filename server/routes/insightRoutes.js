const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getWeather,
    getMarketPrices,
    getSmartPricingSuggestion,
} = require("../controllers/insightController");

router.get("/weather", protect, getWeather);
router.get("/market-prices", protect, getMarketPrices);
router.get("/smart-pricing/:productId", protect, getSmartPricingSuggestion);

module.exports = router;
