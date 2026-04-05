const Request = require("../models/Request");
const Product = require("../models/Product");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

const createRequest = async (req, res) => {
    try {
        const { farmerId, productId, quantity, requestedPrice, message } = req.body;

        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({ message: "Valid quantity is required" });
        }

        let resolvedFarmerId = farmerId;
        let productName = "Custom Request";
        let farmerName = "Farmer";

        if (productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            resolvedFarmerId = product.farmerId;
            productName = product.name;
            farmerName = product.farmerName || farmerName;
        }

        if (!resolvedFarmerId) {
            return res.status(400).json({ message: "farmerId or productId is required" });
        }

        const farmer = await User.findById(resolvedFarmerId);
        if (!farmer || farmer.role !== "farmer") {
            return res.status(404).json({ message: "Farmer not found" });
        }

        const requestDoc = await Request.create({
            buyerId: req.user._id,
            buyerName: req.user.name,
            farmerId: farmer._id,
            farmerName: farmer.name,
            productId: productId || undefined,
            productName,
            quantity: Number(quantity),
            requestedPrice: requestedPrice ? Number(requestedPrice) : undefined,
            message,
        });

        await createNotification({
            userId: farmer._id,
            title: "Your crop got a request",
            message: `${req.user.name} requested ${requestDoc.quantity} kg of ${requestDoc.productName}`,
            type: "request",
            link: "/requests",
        });

        res.status(201).json({ success: true, request: requestDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRequests = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === "farmer") {
            query.farmerId = req.user._id;
        } else {
            query.buyerId = req.user._id;
        }

        const requests = await Request.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: requests.length, requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { status, statusNote } = req.body;
        if (!["Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be Accepted or Rejected" });
        }

        const requestDoc = await Request.findById(req.params.id);
        if (!requestDoc) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (requestDoc.farmerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this request" });
        }

        requestDoc.status = status;
        requestDoc.statusNote = statusNote || "";
        await requestDoc.save();

        await createNotification({
            userId: requestDoc.buyerId,
            title: status === "Accepted" ? "Order accepted" : "Order rejected",
            message:
                status === "Accepted"
                    ? `${requestDoc.farmerName} accepted your request for ${requestDoc.productName}`
                    : `${requestDoc.farmerName} rejected your request for ${requestDoc.productName}`,
            type: "request",
            link: "/requests",
        });

        res.json({ success: true, request: requestDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    updateRequestStatus,
};
