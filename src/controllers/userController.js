const User = require("../models/User");

const userController = {
  // Get all users (Admin only)
  async getAllUsers(req, res) {
    try {
      const users = await User.find().select("-password");
      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  },

  // Get user by ID (Admin/Manager only)
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
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
        message: "Failed to fetch user",
        error: error.message,
      });
    }
  },

  // Update user role (Admin only)
  async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User role updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update user role",
        error: error.message,
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const updates = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
      };

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
      }).select("-password");

      res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  },

  // Deactivate user (Admin only)
  async deactivateUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deactivated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to deactivate user",
        error: error.message,
      });
    }
  },

  // Activate user (Admin only)
  async activateUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User activated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to activate user",
        error: error.message,
      });
    }
  },
};

module.exports = userController;
