const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your_default_secret_key_change_this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax",
  },
  store: MongoStore.create({
    mongoUrl:
      process.env.MONGODB_URI || "mongodb://localhost:27017/cafe_management",
    ttl: 24 * 60 * 60,
    autoRemove: "native",
  }),
};

module.exports = sessionConfig;
