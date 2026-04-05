const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Order = require("./models/Order");
const ChatMessage = require("./models/ChatMessage");
const { setIO } = require("./services/socketService");
const { createNotification } = require("./services/notificationService");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
setIO(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const insightRoutes = require("./routes/insightRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id name role");
        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;
        return next();
    } catch (error) {
        return next(new Error("Socket auth failed"));
    }
});

io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on("chat:join-order", async ({ orderId }) => {
        if (!orderId) return;

        const order = await Order.findById(orderId);
        if (!order) return;

        const isCustomer = order.customerId.toString() === socket.user._id.toString();
        const isFarmer = order.products.some(
            (item) => item.farmerId && item.farmerId.toString() === socket.user._id.toString()
        );

        if (!isCustomer && !isFarmer) return;
        socket.join(`order:${orderId}`);
    });

    socket.on("chat:send", async ({ orderId, message }) => {
        if (!orderId || !message || !message.trim()) return;

        const order = await Order.findById(orderId);
        if (!order) return;

        const isCustomer = order.customerId.toString() === socket.user._id.toString();
        const isFarmer = order.products.some(
            (item) => item.farmerId && item.farmerId.toString() === socket.user._id.toString()
        );
        if (!isCustomer && !isFarmer) return;

        const created = await ChatMessage.create({
            orderId,
            senderId: socket.user._id,
            senderName: socket.user.name,
            senderRole: socket.user.role,
            message: message.trim(),
        });

        io.to(`order:${orderId}`).emit("chat:message", created);

        const recipientIds = new Set();
        recipientIds.add(order.customerId.toString());
        order.products.forEach((item) => {
            if (item.farmerId) {
                recipientIds.add(item.farmerId.toString());
            }
        });
        recipientIds.delete(socket.user._id.toString());

        for (const recipientId of recipientIds) {
            await createNotification({
                userId: recipientId,
                title: "New chat message",
                message: `${socket.user.name}: ${message.trim().slice(0, 60)}`,
                type: "chat",
                link: `/orders/${orderId}`,
            });
        }
    });
});

app.use((err, req, res, next) => {
    if (err && err.message === "Only image files are allowed") {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

// Health check
app.get("/", (req, res) => {
    res.json({ message: "FarmFresh API is running 🌱" });
});

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
