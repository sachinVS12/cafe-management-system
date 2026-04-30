const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { validate, userValidations } = require("../middleware/validation");

router.post(
  "/register",
  validate(userValidations.register),
  authController.register,
);
router.post("/login", validate(userValidations.login), authController.login);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.get("/check-session", authMiddleware, authController.checkSession);

module.exports = router;
