import SystemLog from '../models/SystemLog.js';

export const createSysLog = async (username, action, details) => {
    try {
        await SystemLog.create({
            username,
            action,
            details
        });
    } catch (error) {
        console.error("Failed to create system log:", error);
    }
};

export const getSystemLogs = async (req, res) => {
    try {
        const logs = await SystemLog.find().sort({ createdAt: -1 });
        res.status(200).json({ logs });
    } catch (error) {
        console.error("Error fetching system logs:", error);
        res.status(500).json({ message: "Server error fetching logs" });
    }
};
