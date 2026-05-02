const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Customer routes
router.post("/", authMiddleware, orderController.createOrder);
router.get("/my-orders", authMiddleware, orderController.getUserOrders);

// Admin/Manager/Staff routes
router.get(
  "/",
  authMiddleware,
  roleCheck("admin", "manager", "staff"),
  orderController.getAllOrders,
);

router.get("/:id", authMiddleware, orderController.getOrderById);

router.patch(
  "/:id/status",
  authMiddleware,
  roleCheck("admin", "manager", "staff"),
  orderController.updateOrderStatus,
);

router.patch(
  "/:id/payment",
  authMiddleware,
  roleCheck("admin", "manager"),
  orderController.updatePaymentStatus,
);

router.post("/:id/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;
