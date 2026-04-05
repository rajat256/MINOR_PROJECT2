const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");

// @desc   Get platform-wide analytics
// @route  GET /api/admin/stats
const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalFarmers,
            totalCustomers,
            totalProducts,
            totalOrders,
            orderAgg,
        ] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }),
            User.countDocuments({ role: "farmer" }),
            User.countDocuments({ role: "customer" }),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { orderStatus: "Delivered" } },
                { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
            ]),
        ]);

        const totalRevenue = orderAgg.length ? orderAgg[0].totalRevenue : 0;

        // Recent 7 days order trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyOrders = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalPrice" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Order status breakdown
        const statusBreakdown = await Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalFarmers,
                totalCustomers,
                totalProducts,
                totalOrders,
                totalRevenue: Number(totalRevenue.toFixed(2)),
                dailyOrders,
                statusBreakdown,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get all users (paginated)
// @route  GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        const filter = { role: { $ne: "admin" } };
        if (role && role !== "all") filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(filter),
        ]);

        res.json({
            success: true,
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Toggle user active status (ban/unban)
// @route  PUT /api/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === "admin") {
            return res.status(400).json({ message: "Cannot modify admin accounts" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get all orders (admin view)
// @route  GET /api/admin/orders
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status && status !== "all") filter.orderStatus = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Order.countDocuments(filter),
        ]);

        res.json({
            success: true,
            orders,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get all products (admin view)
// @route  GET /api/admin/products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("farmerId", "name email")
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Delete any product (admin)
// @route  DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ success: true, message: "Product removed by admin" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats,
    getUsers,
    toggleUserStatus,
    getAllOrders,
    getAllProducts,
    deleteProduct,
};
