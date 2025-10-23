import jwt from 'jsonwebtoken';

const ensureAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: "Unauthorized, JWT toked is required.", success: false });
    }
    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Unauthorized, JWT toked is wrong or expired.", success: false });
    }
}

export default ensureAuth;