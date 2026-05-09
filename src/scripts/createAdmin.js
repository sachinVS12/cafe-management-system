const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Define User model directly in the script to avoid schema issues
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    phone: String,
    address: String,
    isActive: Boolean,
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin exists
    const adminExists = await User.findOne({ email: "admin@cafe.com" });

    if (!adminExists) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      const admin = new User({
        name: "Admin User",
        email: "admin@cafe.com",
        password: hashedPassword,
        role: "admin",
        phone: "1234567890",
        address: "Admin Office",
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

      // Update password if needed
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      adminExists.password = hashedPassword;
      await adminExists.save();
      console.log("✅ Admin password reset to: admin123");
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
