const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// User profile routes
router.get("/profile", authMiddleware, userController.getCurrentUser);
router.put("/profile", authMiddleware, userController.updateProfile);

// Admin only routes
router.get("/", authMiddleware, roleCheck("admin"), userController.getAllUsers);

router.get(
  "/:id",
  authMiddleware,
  roleCheck("admin", "manager"),
  userController.getUserById,
);

router.put(
  "/:id/role",
  authMiddleware,
  roleCheck("admin"),
  userController.updateUserRole,
);

router.post(
  "/:id/deactivate",
  authMiddleware,
  roleCheck("admin"),
  userController.deactivateUser,
);

router.post(
  "/:id/activate",
  authMiddleware,
  roleCheck("admin"),
  userController.activateUser,
);

module.exports = router;
