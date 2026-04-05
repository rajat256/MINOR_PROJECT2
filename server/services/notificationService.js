const Notification = require("../models/Notification");
const { getIO } = require("./socketService");

const createNotification = async ({ userId, title, message, type = "system", link = "" }) => {
    const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
    });

    const io = getIO();
    if (io) {
        io.to(`user:${userId.toString()}`).emit("notification:new", notification);
    }

    return notification;
};

module.exports = {
    createNotification,
};
