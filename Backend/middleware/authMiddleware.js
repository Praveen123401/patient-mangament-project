

const jwt = require("jsonwebtoken");
const User = require("../models/user"); // must match the file name exactly (user.js vs User.js) on Linux/deploy

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });

        const user = await User.findById(decoded.id).select("role isActive tokenVersion");

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
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired. Please log in again."
            });
        }

        if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError" || error.name === "CastError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        // Anything else (DB down, unexpected bug) is a server error, not an auth failure
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Optional: role-based access, used after protect
exports.authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action"
        });
    }
    next();
};