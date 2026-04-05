const Order = require("../models/Order");
const Product = require("../models/Product");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createNotification } = require("../services/notificationService");

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

const buildOrderProducts = async (products, decrementStock = false) => {
    if (!Array.isArray(products) || products.length === 0) {
        const error = new Error("No products in order");
        error.statusCode = 400;
        throw error;
    }

    let totalPrice = 0;
    const orderProducts = [];

    for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) {
            const error = new Error(`Product ${item.productId} not found`);
            error.statusCode = 404;
            throw error;
        }

        if (product.quantity < item.quantity) {
            const error = new Error(`Insufficient quantity for ${product.name}. Available: ${product.quantity}`);
            error.statusCode = 400;
            throw error;
        }

        if (decrementStock) {
            const updated = await Product.findOneAndUpdate(
                { _id: product._id, quantity: { $gte: item.quantity } },
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );

            if (!updated) {
                const error = new Error(`Insufficient quantity for ${product.name}. Please refresh cart and retry.`);
                error.statusCode = 400;
                throw error;
            }
        }

        totalPrice += product.price * item.quantity;
        orderProducts.push({
            productId: product._id,
            productName: product.name,
            productImage: product.image,
            farmerId: product.farmerId,
            farmerName: product.farmerName,
            quantity: item.quantity,
            price: product.price,
        });
    }

    return { orderProducts, totalPrice };
};

// @desc   Place an order
// @route  POST /api/orders
const placeOrder = async (req, res) => {
    try {
        const { products, deliveryAddress } = req.body;
        const { orderProducts, totalPrice } = await buildOrderProducts(products, true);

        const order = await Order.create({
            customerId: req.user._id,
            customerName: req.user.name,
            products: orderProducts,
            totalPrice,
            deliveryAddress: deliveryAddress || req.user.location,
            paymentMethod: "Cash on Delivery",
            paymentStatus: "Pending",
        });

        const farmerIds = [...new Set(orderProducts.map((item) => item.farmerId?.toString()).filter(Boolean))];
        for (const farmerId of farmerIds) {
            await createNotification({
                userId: farmerId,
                title: "Your crop got a request",
                message: `${req.user.name} placed an order with your produce`,
                type: "order",
                link: `/orders/${order._id}`,
            });
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// @desc   Create Razorpay order
// @route  POST /api/orders/payment/razorpay/order
const createRazorpayOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ message: "Razorpay is not configured on server" });
        }

        const { products, paymentMethod = "UPI" } = req.body;
        const { totalPrice } = await buildOrderProducts(products, false);

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalPrice * 100),
            currency: "INR",
            receipt: `ff_${Date.now()}`,
            notes: {
                customerId: req.user._id.toString(),
                paymentMethod,
            },
        });

        res.json({
            success: true,
            razorpayOrder,
            amount: totalPrice,
            currency: "INR",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// @desc   Verify Razorpay payment and create order
// @route  POST /api/orders/payment/razorpay/verify
const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            products,
            deliveryAddress,
            paymentMethod = "UPI",
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Missing Razorpay payment details" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const existingOrder = await Order.findOne({ razorpayPaymentId });
        if (existingOrder) {
            return res.status(200).json(existingOrder);
        }

        const { orderProducts, totalPrice } = await buildOrderProducts(products, true);

        const order = await Order.create({
            customerId: req.user._id,
            customerName: req.user.name,
            products: orderProducts,
            totalPrice,
            deliveryAddress: deliveryAddress || req.user.location,
            paymentMethod,
            paymentStatus: "Completed",
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paidAt: new Date(),
        });

        const farmerIds = [...new Set(orderProducts.map((item) => item.farmerId?.toString()).filter(Boolean))];
        for (const farmerId of farmerIds) {
            await createNotification({
                userId: farmerId,
                title: "Your crop got a request",
                message: `${req.user.name} placed a paid order with your produce`,
                type: "order",
                link: `/orders/${order._id}`,
            });
        }

        res.status(201).json(order);
    } catch (error) {
        if (error.code === 11000) {
            const existingOrder = await Order.findOne({ razorpayPaymentId: req.body.razorpayPaymentId });
            if (existingOrder) {
                return res.status(200).json(existingOrder);
            }
        }
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// @desc   Get orders (customer sees own, farmer sees orders with their products)
// @route  GET /api/orders
const getOrders = async (req, res) => {
    try {
        let orders;

        if (req.user.role === "customer") {
            orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
        } else if (req.user.role === "farmer") {
            orders = await Order.find({
                "products.farmerId": req.user._id,
            }).sort({ createdAt: -1 });
        }

        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Update order status (farmer only)
// @route  PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const validStatuses = ["Ordered", "Confirmed", "Shipped", "Delivered", "Cancelled"];

        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: "Invalid order status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Check if updated order has items from this farmer
        const hasFarmerItems = order.products.some(
            (p) => p.farmerId?.toString() === req.user._id.toString()
        );
        if (!hasFarmerItems) {
            return res.status(403).json({ message: "Not authorized to update this order" });
        }

        order.orderStatus = orderStatus;
        await order.save();

        await createNotification({
            userId: order.customerId,
            title: orderStatus === "Confirmed" ? "Order accepted" : "Order update",
            message: `Your order #${order._id.toString().slice(-8).toUpperCase()} is now ${orderStatus}`,
            type: "order",
            link: `/orders/${order._id}`,
        });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get order by ID
// @route  GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Authorization check
        const isCustomer = order.customerId.toString() === req.user._id.toString();
        const isFarmer = order.products.some(p => p.farmerId?.toString() === req.user._id.toString());

        if (!isCustomer && !isFarmer && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this order" });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Create claim on an order (customer only)
// @route  POST /api/orders/:id/claims
const createClaim = async (req, res) => {
    try {
        const { claimType, description } = req.body;

        if (!claimType || !description?.trim()) {
            return res.status(400).json({ message: "Claim type and description are required" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to raise claim for this order" });
        }

        order.claims.push({
            claimType,
            description: description.trim(),
            createdBy: req.user._id,
            createdByName: req.user.name,
        });

        await order.save();
        const createdClaim = order.claims[order.claims.length - 1];

        res.status(201).json({ success: true, claim: createdClaim, orderId: order._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get all claims of an order
// @route  GET /api/orders/:id/claims
const getOrderClaims = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const isCustomer = order.customerId.toString() === req.user._id.toString();
        const isFarmer = order.products.some((p) => p.farmerId?.toString() === req.user._id.toString());

        if (!isCustomer && !isFarmer && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view claims for this order" });
        }

        res.json({ success: true, claims: order.claims, orderId: order._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get single claim details
// @route  GET /api/orders/:id/claims/:claimId
const getClaimById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const isCustomer = order.customerId.toString() === req.user._id.toString();
        const isFarmer = order.products.some((p) => p.farmerId?.toString() === req.user._id.toString());

        if (!isCustomer && !isFarmer && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this claim" });
        }

        const claim = order.claims.id(req.params.claimId);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        res.json({
            success: true,
            claim,
            order: {
                _id: order._id,
                orderStatus: order.orderStatus,
                createdAt: order.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Update claim status (farmer only)
// @route  PUT /api/orders/:id/claims/:claimId/status
const updateClaimStatus = async (req, res) => {
    try {
        const { status, resolutionNote } = req.body;
        const validStatuses = ["Submitted", "Under Review", "Resolved", "Rejected"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid claim status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const hasFarmerItems = order.products.some(
            (p) => p.farmerId?.toString() === req.user._id.toString()
        );
        if (!hasFarmerItems) {
            return res.status(403).json({ message: "Not authorized to update claims for this order" });
        }

        const claim = order.claims.id(req.params.claimId);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        claim.status = status;
        if (typeof resolutionNote === "string") {
            claim.resolutionNote = resolutionNote.trim();
        }
        claim.resolvedAt = status === "Resolved" || status === "Rejected" ? new Date() : undefined;

        await order.save();
        res.json({ success: true, claim });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Cancel an order (customer only, before Shipped)
// @route  PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to cancel this order" });
        }

        if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus)) {
            return res.status(400).json({ message: `Cannot cancel order that is already ${order.orderStatus}` });
        }

        // Restore stock
        for (const item of order.products) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: item.quantity },
            });
        }

        order.orderStatus = "Cancelled";
        await order.save();

        // Notify farmers
        const farmerIds = [...new Set(order.products.map((p) => p.farmerId?.toString()).filter(Boolean))];
        for (const farmerId of farmerIds) {
            await createNotification({
                userId: farmerId,
                title: "Order cancelled",
                message: `Order #${order._id.toString().slice(-8).toUpperCase()} was cancelled by the customer`,
                type: "order",
                link: `/orders/${order._id}`,
            });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    placeOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getOrders,
    updateOrderStatus,
    getOrderById,
    createClaim,
    getOrderClaims,
    getClaimById,
    updateClaimStatus,
    cancelOrder,
};
