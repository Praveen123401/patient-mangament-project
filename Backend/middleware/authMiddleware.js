const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid or inactive user"
            });
        }

        if ((decoded.ver || 0) !== (user.tokenVersion || 0)) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        req.user = {
            id: user._id.toString(),
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                error.name === "TokenExpiredError"
                    ? "Access token expired. Please log in again."
                    : "Invalid or expired token"
        });
    }
};