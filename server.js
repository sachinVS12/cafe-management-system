const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = require("./src/app");

// Try to use MongoDB session store, fallback to memory store
let sessionConfig;

try {
  const MongoStore = require("connect-mongo");
  sessionConfig = {
    secret: process.env.SESSION_SECRET || "default_secret_key_change_this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60,
    }),
  };
  console.log("Using MongoDB session store");
} catch (error) {
  console.log("Falling back to memory session store");
  sessionConfig = {
    secret: process.env.SESSION_SECRET || "default_secret_key_change_this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };
}

// Apply session middleware
app.use(session(sessionConfig));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("\n💡 Troubleshooting Tips:");
    console.error("1. Make sure MongoDB is installed");
    console.error("2. Start MongoDB service:");
    console.error("   - Windows: net start MongoDB");
    console.error("   - Mac: brew services start mongodb-community");
    console.error("   - Linux: sudo systemctl start mongod");
    console.error("3. Check if MongoDB URI is correct in .env file");

    // Start server even without MongoDB for testing
    console.log(
      "\n⚠️  Starting server without MongoDB (some features will not work)",
    );
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (limited functionality)`);
    });
  });
