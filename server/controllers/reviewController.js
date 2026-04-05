const Order = require("../models/Order");
const Review = require("../models/Review");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

const createReview = async (req, res) => {
    try {
        const { orderId, farmerId, rating, comment } = req.body;

        if (!orderId || !farmerId || !rating) {
            return res.status(400).json({ message: "orderId, farmerId and rating are required" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only buyer can rate this order" });
        }

        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({ message: "Review is allowed after delivery" });
        }

        const farmerInOrder = order.products.some(
            (item) => item.farmerId && item.farmerId.toString() === farmerId
        );

        if (!farmerInOrder) {
            return res.status(400).json({ message: "Farmer is not part of this order" });
        }

        const review = await Review.findOneAndUpdate(
            { orderId, buyerId: req.user._id },
            {
                orderId,
                farmerId,
                buyerId: req.user._id,
                buyerName: req.user.name,
                rating: Number(rating),
                comment: comment || "",
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        await createNotification({
            userId: farmerId,
            title: "New farmer rating",
            message: `${req.user.name} rated you ${Number(rating).toFixed(1)}/5`,
            type: "review",
            link: "/profile",
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFarmerReviews = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const reviews = await Review.find({ farmerId }).sort({ createdAt: -1 }).limit(100);
        const avgRating = reviews.length
            ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
            : 0;

        const farmer = await User.findById(farmerId).select("name");

        res.json({
            success: true,
            farmer: farmer || null,
            count: reviews.length,
            averageRating: Number(avgRating.toFixed(2)),
            reviews,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getFarmerReviews,
};
