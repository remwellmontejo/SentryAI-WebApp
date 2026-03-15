import Notification from '../models/Notification.js';

export const createNotification = async (message, type, referenceId = null) => {
    try {
        await Notification.create({ message, type, referenceId });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50); // Get latest 50
        res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};
