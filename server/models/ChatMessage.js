const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderName: {
            type: String,
            required: true,
        },
        senderRole: {
            type: String,
            enum: ["farmer", "customer"],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
