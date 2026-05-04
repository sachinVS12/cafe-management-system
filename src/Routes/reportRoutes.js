const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// All report routes require authentication and admin/manager role
router.use(authMiddleware);
router.use(roleCheck("admin", "manager"));

// Get reports
router.get("/daily", reportController.getDailyReport);
router.get("/weekly", reportController.getWeeklyReport);
router.get("/monthly", reportController.getMonthlyReport);
router.get("/custom", reportController.getCustomReport);
router.get("/dashboard", reportController.getDashboardStats);

// Download reports
router.post("/download/excel", reportController.downloadExcelReport);
router.post("/download/pdf", reportController.downloadPdfReport);

module.exports = router;
