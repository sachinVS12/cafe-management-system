const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = require("./src/app");

// Simple session configuration without MongoStore initially
const sessionConfig = {
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
    console.error("\n💡 Make sure MongoDB is running");
    console.error("💡 Starting server with limited functionality...");

    // Start server even without MongoDB for API testing
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} (limited functionality - no database)`,
      );
      console.log(`⚠️  Some features will not work without MongoDB`);
    });
  });
