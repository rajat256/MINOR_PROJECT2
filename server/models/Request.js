const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        buyerName: {
            type: String,
            required: true,
        },
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        farmerName: {
            type: String,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        productName: {
            type: String,
            default: "Custom Request",
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        requestedPrice: {
            type: Number,
            min: 0,
        },
        message: {
            type: String,
            trim: true,
            maxlength: 400,
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        },
        statusNote: {
            type: String,
            trim: true,
            maxlength: 400,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
