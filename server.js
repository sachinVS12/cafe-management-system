const express = require("express");
const cors = require("cors");
const session = require("express-session");
//const sessionConfig = require("./config/session");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

// Import routes
const authRoutes = require("./src/Routes/authRoutes");
const productRoutes = require("./src/Routes/productRoutes");
const orderRoutes = require("./src/Routes/orderRoutes");
const userRoutes = require("./src/Routes/userRoutes");
const reportRoutes = require("./src/Routes/reportRoutes");
const paymentRoutes = require("./src/Routes/paymentRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Cafe Management System API is running",
    timestamp: new Date(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;
