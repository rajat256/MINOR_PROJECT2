const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: String,
    productImage: String,
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    farmerName: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
    },
});

const claimSchema = new mongoose.Schema(
    {
        claimType: {
            type: String,
            enum: ["Damaged Product", "Wrong Item", "Missing Item", "Payment Issue", "Other"],
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["Submitted", "Under Review", "Resolved", "Rejected"],
            default: "Submitted",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        createdByName: String,
        resolutionNote: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        resolvedAt: Date,
    },
    { timestamps: true }
);

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        customerName: String,
        products: [orderItemSchema],
        totalPrice: {
            type: Number,
            required: true,
        },
        orderStatus: {
            type: String,
            enum: ["Ordered", "Confirmed", "Shipped", "Delivered", "Cancelled"],
            default: "Ordered",
        },
        deliveryAddress: {
            type: String,
        },
        paymentMethod: {
            type: String,
            enum: ["Cash on Delivery", "UPI", "Wallet", "Credit/Debit Card"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Completed", "Failed"],
            default: "Pending",
        },
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
            unique: true,
            sparse: true,
        },
        razorpaySignature: {
            type: String,
        },
        paidAt: {
            type: Date,
        },
        claims: [claimSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
