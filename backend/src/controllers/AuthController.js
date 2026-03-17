import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';
import { createSysLog } from './SystemLogController.js'; // IMPORT LOGGING

const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        const user = await UserModel.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "User already exists", success: false });
        }
        
        // Count users to verify if this is the first user
        const userCount = await UserModel.countDocuments();
        const role = userCount === 0 ? 'Admin' : 'Employee';
        // First user auto-active, rest inactive
        const status = userCount === 0 ? 'active' : 'inactive';

        const newUser = new UserModel({ username, email, password, status, role, firstName: firstName || '', lastName: lastName || '' });
        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();

        if (userCount === 0) {
            await createSysLog(username, 'REGISTER_ADMIN', `Registered as the first administrator account (${email})`);
            return res.status(201).json({ message: "First Admin account registered successfully.", success: true });
        } else {
            await createSysLog(username, 'REGISTER_EMPLOYEE', `Registered a new employee account (${email})`);
            return res.status(201).json({ message: "User registered successfully. Please wait for the activation of your account. You will be notified by your administrator.", success: true });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message, success: false });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: "Email or password is incorrect.", success: false });
        }
        if (user.status !== 'active') {
            return res.status(403).json({ message: "Your account is not yet activated. Please contact an administrator.", success: false });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ message: "Email or password is incorrect.", success: false });
        }
        const jwtToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role, username: user.username, firstName: user.firstName || '', lastName: user.lastName || '' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await createSysLog(user.username, 'USER_LOGIN', `User logged in from ${email}`);

        return res.status(200).json({
            message: "Login successful",
            token: jwtToken, 
            email: email,
            username: user.username,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message, success: false });
    }
}

export { register, login };