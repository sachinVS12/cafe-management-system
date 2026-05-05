const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/User");

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminExists = await User.findOne({ email: "admin@cafe.com" });

    if (!adminExists) {
      const admin = new User({
        name: "Admin User",
        email: "admin@cafe.com",
        password: "admin123",
        role: "admin",
        phone: "1234567890",
        isActive: true,
      });

      await admin.save();
      console.log("Admin user created successfully");
      console.log("Email: admin@cafe.com");
      console.log("Password: admin123");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();
