const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vegetable name is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: 0,
            max: [1000, "Price cannot exceed 1000"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: 0,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
            default: "",
        },
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        farmerName: {
            type: String,
        },
        location: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            default: "Vegetable",
        },
    },
    { timestamps: true }
);

// Index for search
productSchema.index({ name: "text", location: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
