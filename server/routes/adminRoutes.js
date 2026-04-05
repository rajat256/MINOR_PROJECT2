const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
    getStats,
    getUsers,
    toggleUserStatus,
    getAllOrders,
    getAllProducts,
    deleteProduct,
} = require("../controllers/adminController");

// All routes require auth + admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/status", toggleUserStatus);
router.get("/orders", getAllOrders);
router.get("/products", getAllProducts);
router.delete("/products/:id", deleteProduct);

module.exports = router;
