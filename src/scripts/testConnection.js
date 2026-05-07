const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connection successful!");

    // List all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📚 Collections:",
      collections.map((c) => c.name),
    );

    await mongoose.disconnect();
    console.log("✅ Disconnected successfully");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();
