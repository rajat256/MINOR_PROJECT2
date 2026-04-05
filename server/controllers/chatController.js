const Order = require("../models/Order");
const ChatMessage = require("../models/ChatMessage");
const { getIO } = require("../services/socketService");
const { createNotification } = require("../services/notificationService");

const canAccessOrder = (order, userId) => {
    if (!order) return false;
    const isCustomer = order.customerId.toString() === userId.toString();
    const isFarmer = order.products.some(
        (item) => item.farmerId && item.farmerId.toString() === userId.toString()
    );
    return isCustomer || isFarmer;
};

const getOrderMessages = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order || !canAccessOrder(order, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to access this chat" });
        }

        const messages = await ChatMessage.find({ orderId }).sort({ createdAt: 1 }).limit(300);
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postOrderMessage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const order = await Order.findById(orderId);
        if (!order || !canAccessOrder(order, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to send in this chat" });
        }

        const newMessage = await ChatMessage.create({
            orderId,
            senderId: req.user._id,
            senderName: req.user.name,
            senderRole: req.user.role,
            message: message.trim(),
        });

        const io = getIO();
        if (io) {
            io.to(`order:${orderId}`).emit("chat:message", newMessage);
        }

        const recipientIds = new Set();
        recipientIds.add(order.customerId.toString());
        order.products.forEach((item) => {
            if (item.farmerId) {
                recipientIds.add(item.farmerId.toString());
            }
        });
        recipientIds.delete(req.user._id.toString());

        for (const recipientId of recipientIds) {
            await createNotification({
                userId: recipientId,
                title: "New chat message",
                message: `${req.user.name}: ${message.trim().slice(0, 60)}`,
                type: "chat",
                link: `/orders/${orderId}`,
            });
        }

        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrderMessages,
    postOrderMessage,
};
