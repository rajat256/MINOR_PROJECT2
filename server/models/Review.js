const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        buyerName: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 400,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ orderId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
