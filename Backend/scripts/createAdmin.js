
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user");

dotenv.config();

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing");
    }

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An admin account already exists:", existingAdmin.email);
      return;
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser) {
      throw new Error(
        "This email already belongs to another account. Use a different admin email."
      );
    }

    const admin = await User.create({
      name: "Hospital Administrator",
      email,
      password,
      role: "admin",
      isActive: true,
      emailVerified: true,
    });

    console.log("Admin account created successfully!");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
