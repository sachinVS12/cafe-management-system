const User = require("../models/User");

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { name, email, password, phone, address } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        address,
        role: "customer",
      });

      await user.save();

      // Create session
      req.session.userId = user._id;
      req.session.userRole = user.role;

      res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Create session
      req.session.userId = user._id;
      req.session.userRole = user.role;

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message,
      });
    }
  },

  // Logout user
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Logout failed",
        });
      }

      res.clearCookie("connect.sid");
      res.json({
        success: true,
        message: "Logout successful",
      });
    });
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get user info",
      });
    }
  },

  // Check session
  async checkSession(req, res) {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        message: "No active session",
      });
    }

    const user = await User.findById(req.session.userId).select("-password");
    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  },
};

module.exports = authController;
