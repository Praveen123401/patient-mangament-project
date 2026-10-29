const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        // User information
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            maxlength: [72, "Password cannot exceed 72 UTF-8 bytes"],
            select: false
        },

        // User role
        role: {
            type: String,
            enum: ["admin", "doctor", "receptionist"],
            default: "receptionist",
            required: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
            type: Date,
            default: null
        },

        // Email verification
        emailVerified: {
            type: Boolean,
            default: false
        },

        emailOtpHash: {
            type: String,
            select: false
        },

        emailOtpExpires: {
            type: Date,
            select: false
        },

        emailOtpAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        // Forgot password / reset password OTP
        resetOtpHash: {
            type: String,
            select: false
        },

        resetOtpExpires: {
            type: Date,
            select: false
        },

        resetOtpAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        resetOtpVerified: {
            type: Boolean,
            default: false,
            select: false
        },

        // Invalidate previous JWT access tokens on logout/password change
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const passwordBytes = Buffer.byteLength(this.password, "utf8");

    if (passwordBytes > 72) {
        throw new Error("Password cannot exceed 72 UTF-8 bytes");
    }

    this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with stored password hash
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields from JSON responses
userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.__v;
    delete user.emailOtpHash;
    delete user.emailOtpExpires;
    delete user.emailOtpAttempts;
    delete user.resetOtpHash;
    delete user.resetOtpExpires;
    delete user.resetOtpAttempts;
    delete user.resetOtpVerified;

    return user;
};

// Create User model
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;