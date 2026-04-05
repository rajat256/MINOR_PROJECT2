const Product = require("../models/Product");

const buildImageUrl = (req, fileName) => {
    if (!fileName) return "";
    return `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
};

// @desc   Get all products with optional search/filter
// @route  GET /api/products
const getProducts = async (req, res) => {
    try {
        const { search, location, minPrice, maxPrice, sortBy } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }

        if (location) {
            query.location = { $regex: location, $options: "i" };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortQuery = { createdAt: -1 };
        if (sortBy === "price_asc") sortQuery = { price: 1 };
        if (sortBy === "price_desc") sortQuery = { price: -1 };
        if (sortBy === "newest") sortQuery = { createdAt: -1 };

        const products = await Product.find(query).sort(sortQuery).lean();
        res.json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get single product
// @route  GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate(
            "farmerId",
            "name email phone location"
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get farmer's own products
// @route  GET /api/products/farmer/my
const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ farmerId: req.user._id }).sort({
            createdAt: -1,
        });
        res.json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Create a product
// @route  POST /api/products
const createProduct = async (req, res) => {
    try {
        const { name, price, quantity, description, image, location } = req.body;

        if (!name || !price || !quantity) {
            return res
                .status(400)
                .json({ message: "Name, price, and quantity are required" });
        }

        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice) || numericPrice < 0 || numericPrice > 1000) {
            return res
                .status(400)
                .json({ message: "Price must be between 0 and 1000" });
        }

        const product = await Product.create({
            name,
            price: numericPrice,
            quantity,
            description,
            image: req.file ? buildImageUrl(req, req.file.filename) : image || "",
            farmerId: req.user._id,
            farmerName: req.user.name,
            location: location || req.user.location,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Update a product
// @route  PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (product.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this product" });
        }

        const payload = { ...req.body };
        if (payload.price !== undefined) {
            const numericPrice = Number(payload.price);
            if (Number.isNaN(numericPrice) || numericPrice < 0 || numericPrice > 1000) {
                return res
                    .status(400)
                    .json({ message: "Price must be between 0 and 1000" });
            }
            payload.price = numericPrice;
        }
        if (req.file) {
            payload.image = buildImageUrl(req, req.file.filename);
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Delete a product
// @route  DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (product.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this product" });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
