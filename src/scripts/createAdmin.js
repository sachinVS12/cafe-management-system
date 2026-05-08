const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/User");

async function createAdminUser() {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ Connected to MongoDB");

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
      console.log("👤 Role: admin");
    } else {
      console.log("⚠️ Admin user already exists");
      console.log("📧 Email: admin@cafe.com");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Make sure MongoDB is running:");
      console.error("   - Windows: net start MongoDB");
      console.error("   - Mac: brew services start mongodb-community");
      console.error("   - Linux: sudo systemctl start mongod");
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the function
createAdminUser();
