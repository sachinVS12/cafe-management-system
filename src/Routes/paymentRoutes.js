const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All payment routes require authentication
router.use(authMiddleware);

// Payment processing
router.post(
  "/process",
  roleCheck("admin", "manager", "staff"),
  paymentController.processPayment,
);
router.post(
  "/refund",
  roleCheck("admin", "manager"),
  paymentController.processRefund,
);

// UPI payment
router.get("/generate-qr/:orderId", paymentController.generateUPIQR);
router.post("/verify-upi", paymentController.verifyUPIPayment);

// Receipt
router.get("/receipt/:paymentId", paymentController.downloadReceipt);

// Payment details
router.get("/:paymentId", paymentController.getPaymentDetails);
router.get("/order/:orderId", paymentController.getOrderPayments);

// Statistics (admin/manager only)
router.get(
  "/stats/all",
  roleCheck("admin", "manager"),
  paymentController.getPaymentStats,
);

module.exports = router;
