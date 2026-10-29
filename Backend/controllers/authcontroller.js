const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const OTP_EXPIRY_MINUTES = Math.max(
    1,
    Number(process.env.OTP_EXPIRES_MINUTES) || 5
);

const OTP_MAX_ATTEMPTS = Math.max(
    1,
    Number(process.env.OTP_MAX_ATTEMPTS) || 5
);

// Generate JWT access token.
const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing from .env");
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            ver: user.tokenVersion || 0
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "15m"
        }
    );
};

// Generate a cryptographically secure six-digit OTP.
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTPs before storing them.
const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sendOtpEmail = async (email, otp, purpose) => {
    const subject =
        purpose === "reset"
            ? "Patient Management System - Password Reset OTP"
            : "Patient Management System - Email Verification OTP";

    const text = [
        `Your verification code is ${otp}.`,
        `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        "Do not share this code with anyone.",
        "If you did not request this code, you can ignore this email."
    ].join("\n");

    await sendEmail({
        to: email,
        subject,
        text,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:500px">
                <h2>Patient Management System</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing:6px">${otp}</h1>
                <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
                <p>Never share this code with anyone.</p>
            </div>
        `
    });
};

// REGISTER / SIGN UP
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedName.length < 2 || normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 100 characters"
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters and no more than 72 UTF-8 bytes"
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const otp = generateOtp();

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            phone: typeof phone === "string" ? phone.trim() : "",
            role: "receptionist",
            emailVerified: false,
            emailOtpHash: hashOtp(otp),
            emailOtpExpires: new Date(
                Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
            ),
            emailOtpAttempts: 0
        });

        // Do not issue an authenticated token until email is verified.
        try {
            await sendOtpEmail(normalizedEmail, otp, "verify");
        } catch (emailError) {
            // Remove the newly created account if the verification email
            // cannot be sent, so the user can try registering again.
            await User.deleteOne({ _id: user._id });

            console.error("Verification email error:", emailError.message);

            return res.status(503).json({
                success: false,
                message: "Unable to send verification email. Please try again later."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email using the OTP we sent."
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// VERIFY EMAIL OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid email and six-digit OTP are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+emailOtpHash +emailOtpExpires +emailOtpAttempts");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified"
            });
        }

        if (
            !user.emailOtpHash ||
            !user.emailOtpExpires ||
            user.emailOtpExpires.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        if ((user.emailOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        if (hashOtp(otp) !== user.emailOtpHash) {
            user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.emailVerified = true;
        user.emailOtpHash = undefined;
        user.emailOtpExpires = undefined;
        user.emailOtpAttempts = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP"
        });
    }
};

// RESEND EMAIL VERIFICATION OTP
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !isValidEmail(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the account requires verification, an OTP will be sent."
            });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified"
            });
        }

        const otp = generateOtp();

        user.emailOtpHash = hashOtp(otp);
        user.emailOtpExpires = new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        );
        user.emailOtpAttempts = 0;

        await user.save();

        try {
            await sendOtpEmail(user.email, otp, "verify");
        } catch (emailError) {
            console.error("Resend OTP email error:", emailError.message);

            return res.status(503).json({
                success: false,
                message: "Unable to send OTP. Please try again later."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new verification OTP has been sent."
        });
    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to resend OTP"
        });
    }
};

// LOGIN
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in."
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || "15m",
            user
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// LOGOUT
// Requires authentication middleware to validate tokenVersion.
exports.logoutUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Logout failed"
        });
    }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !isValidEmail(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        // Use the same response whether the account exists or not.
        const genericResponse = {
            success: true,
            message: "If an account exists for this email, password-reset instructions will be sent."
        };

        if (!user || !user.emailVerified || !user.isActive) {
            return res.status(200).json(genericResponse);
        }

        const otp = generateOtp();

        user.resetOtpHash = hashOtp(otp);
        user.resetOtpExpires = new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        );
        user.resetOtpAttempts = 0;
        user.resetOtpVerified = false;

        await user.save();

        try {
            await sendOtpEmail(user.email, otp, "reset");
        } catch (emailError) {
            // Clear the pending reset if email delivery fails.
            user.resetOtpHash = undefined;
            user.resetOtpExpires = undefined;
            user.resetOtpAttempts = 0;
            user.resetOtpVerified = false;
            await user.save();

            console.error("Password reset email error:", emailError.message);

            return res.status(503).json({
                success: false,
                message: "Unable to send password-reset email. Please try again later."
            });
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process password-reset request"
        });
    }
};

// VERIFY PASSWORD-RESET OTP
exports.verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid email and six-digit OTP are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpVerified");

        if (
            !user ||
            !user.resetOtpHash ||
            !user.resetOtpExpires ||
            user.resetOtpExpires.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        if ((user.resetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        if (hashOtp(otp) !== user.resetOtpHash) {
            user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Do not mark the account as verified from a password-reset OTP.
        user.resetOtpVerified = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified. You can now reset your password."
        });
    } catch (error) {
        console.error("Reset OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify password-reset OTP"
        });
    }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp) ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, and new password are required"
            });
        }

        if (
            newPassword.length < 6 ||
            Buffer.byteLength(newPassword, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters and no more than 72 UTF-8 bytes"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpVerified");

        if (
            !user ||
            !user.resetOtpHash ||
            !user.resetOtpExpires ||
            user.resetOtpExpires.getTime() <= Date.now() ||
            !user.resetOtpVerified ||
            hashOtp(otp) !== user.resetOtpHash
        ) {
            return res.status(400).json({
                success: false,
                message: "Please verify a valid password-reset OTP first."
            });
        }

        // User model's pre-save hook hashes the new password.
        user.password = newPassword;
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = 0;
        user.resetOtpVerified = false;

        // Invalidate existing access tokens.
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });
    }
};

// CHANGE PASSWORD - authenticated user
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (
            newPassword.length < 6 ||
            Buffer.byteLength(newPassword, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters and no more than 72 UTF-8 bytes"
            });
        }

        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = newPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again."
        });
    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to change password"
        });
    }
};

// GET CURRENT USER PROFILE
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user"
        });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const updates = {};

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be between 2 and 100 characters"
                });
            }

            updates.name = name.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== "string" || phone.length > 30) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid phone number"
                });
            }

            updates.phone = phone.trim();
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Update profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};