import UserModel from '../models/User.js';
import { createSysLog } from './SystemLogController.js'; // IMPORT LOGGING

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['Admin', 'Employee'].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const adminUser = req.user?.username || "System";
        await createSysLog(adminUser, 'UPDATE_USER_ROLE', `Updated role of ${user.username} to ${role}`);

        res.status(200).json({ success: true, message: "Role updated successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating role", error: error.message });
    }
};

// Update user status
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const user = await UserModel.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const adminUser = req.user?.username || "System";
        await createSysLog(adminUser, 'UPDATE_USER_STATUS', `Changed status of ${user.username} to ${status}`);

        res.status(200).json({ success: true, message: "Status updated successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating status", error: error.message });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await UserModel.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const adminUser = req.user?.username || "System";
        await createSysLog(adminUser, 'DELETE_USER', `Deleted account of ${user.username} (${user.email})`);

        res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
    }
};
