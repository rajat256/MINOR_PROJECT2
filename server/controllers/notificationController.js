const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(60);

        const unreadCount = notifications.filter((item) => !item.read).length;
        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
};
