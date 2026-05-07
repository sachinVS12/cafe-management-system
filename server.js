const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;

// Import app
const app = require("./src/app");

// Connect to MongoDB with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Update session store with mongoose connection
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
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName: "cafe_management",
        collectionName: "sessions",
        ttl: 24 * 60 * 60,
      }),
    };

    // Set session middleware in app
    app.use(session(sessionConfig));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Please make sure MongoDB is running");
    process.exit(1);
  });
