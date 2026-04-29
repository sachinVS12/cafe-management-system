const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

dotenv.config();

const app = require("./src/app");
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
