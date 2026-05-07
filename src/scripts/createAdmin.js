const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/User");

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Check if admin exists
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
      console.log("✅ Admin user created successfully");
      console.log("📧 Email: admin@cafe.com");
      console.log("🔑 Password: admin123");
    } else {
      console.log("⚠️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
createAdminUser();
