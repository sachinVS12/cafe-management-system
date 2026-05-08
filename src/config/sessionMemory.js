const session = require("express-session");

// Simple memory store for development only
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

module.exports = sessionConfig;
