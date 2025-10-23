import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const status = 'inactive';
        const user = await UserModel.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "User already exists", success: false });
        }
        const newUser = new UserModel({ username, email, password, status });
        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();
        return res.status(201).json({ message: "User registered successfully. Please wait for the activation of your account. You will be notified by your administrator.", success: true });
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
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.status(200).json({
            message: "Login successful",
            token: jwtToken, email: email,
            username: user.username,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message, success: false });
    }
}

export { register, login };