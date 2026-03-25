/**
 * Middleware to verify external API token for traffic authority access.
 * Uses a static token from EXTERNAL_API_TOKEN env variable.
 */
const verifyApiToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No API token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!process.env.EXTERNAL_API_TOKEN) {
            console.error("[EXTERNAL API] EXTERNAL_API_TOKEN is not configured in .env");
            return res.status(500).json({
                success: false,
                message: "API token not configured on server."
            });
        }

        if (token !== process.env.EXTERNAL_API_TOKEN) {
            return res.status(401).json({
                success: false,
                message: "Invalid API token."
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

export { verifyApiToken };
