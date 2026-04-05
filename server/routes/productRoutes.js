const express = require("express");
const router = express.Router();
const {
    getProducts,
    getProductById,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const { protect, farmerOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", getProducts);

// Farmer protected routes
router.get("/farmer/my", protect, farmerOnly, getMyProducts);
router.post("/", protect, farmerOnly, upload.single("image"), createProduct);
router.put("/:id", protect, farmerOnly, upload.single("image"), updateProduct);
router.delete("/:id", protect, farmerOnly, deleteProduct);

router.get("/:id", getProductById);

module.exports = router;
