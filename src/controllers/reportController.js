const Order = require("../models/Order");
const Product = require("../models/Product");

const reportController = {
  // Generate Daily Report
  async getDailyReport(req, res) {
    try {
      const { date } = req.query;
      let targetDate = date ? new Date(date) : new Date();

      // Set date range for the day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const report = await generateReport(startOfDay, endOfDay);

      res.json({
        success: true,
        reportType: "daily",
        date: targetDate,
        ...report,
      });
    } catch (error) {
      console.error("Daily report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate daily report",
        error: error.message,
      });
    }
  },

  // Generate Weekly Report
  async getWeeklyReport(req, res) {
    try {
      const { weekStart } = req.query;
      let startDate = weekStart ? new Date(weekStart) : new Date();

      // Get start of week (Sunday)
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const report = await generateReport(startDate, endDate);

      res.json({
        success: true,
        reportType: "weekly",
        startDate,
        endDate,
        ...report,
      });
    } catch (error) {
      console.error("Weekly report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate weekly report",
        error: error.message,
      });
    }
  },

  // Generate Monthly Report
  async getMonthlyReport(req, res) {
    try {
      const { year, month } = req.query;
      let targetYear = year ? parseInt(year) : new Date().getFullYear();
      let targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const report = await generateReport(startDate, endDate);

      res.json({
        success: true,
        reportType: "monthly",
        year: targetYear,
        month: targetMonth + 1,
        startDate,
        endDate,
        ...report,
      });
    } catch (error) {
      console.error("Monthly report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate monthly report",
        error: error.message,
      });
    }
  },

  // Get Custom Date Range Report
  async getCustomReport(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const report = await generateReport(start, end);

      res.json({
        success: true,
        reportType: "custom",
        startDate: start,
        endDate: end,
        ...report,
      });
    } catch (error) {
      console.error("Custom report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate custom report",
        error: error.message,
      });
    }
  },

  // Get Dashboard Stats
  async getDashboardStats(req, res) {
    try {
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get stats for different periods
      const [
        dailyStats,
        weeklyStats,
        monthlyStats,
        topProducts,
        lowStockProducts,
      ] = await Promise.all([
        getPeriodStats(startOfToday, new Date()),
        getPeriodStats(startOfWeek, new Date()),
        getPeriodStats(startOfMonth, new Date()),
        getTopProducts(10),
        getLowStockProducts(),
      ]);

      res.json({
        success: true,
        data: {
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats,
          topProducts,
          lowStockProducts,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard stats",
        error: error.message,
      });
    }
  },

  // Download Excel Report (Simplified)
  async downloadExcelReport(req, res) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const reportData = await generateReport(start, end);

      // For now, send JSON instead of Excel
      res.json({
        success: true,
        message: "Excel report data",
        data: reportData,
      });
    } catch (error) {
      console.error("Excel report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate Excel report",
        error: error.message,
      });
    }
  },

  // Download PDF Report (Simplified)
  async downloadPdfReport(req, res) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const reportData = await generateReport(start, end);

      // For now, send JSON instead of PDF
      res.json({
        success: true,
        message: "PDF report data",
        data: reportData,
      });
    } catch (error) {
      console.error("PDF report error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF report",
        error: error.message,
      });
    }
  },
};

// Helper function to generate report data
async function generateReport(startDate, endDate) {
  // Get all orders in date range
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" },
  })
    .populate("user", "name email")
    .populate("items.product", "name price");

  // Calculate summary statistics
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate total items sold
  let totalItemsSold = 0;
  const productSales = {};

  orders.forEach((order) => {
    if (order.items && order.items.length) {
      order.items.forEach((item) => {
        totalItemsSold += item.quantity || 0;

        const productName = item.product?.name || "Unknown Product";
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSales[productName].totalQuantity += item.quantity || 0;
        productSales[productName].totalRevenue +=
          (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  // Get top products
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  // Calculate payment methods distribution
  const paymentMethods = {};
  orders.forEach((order) => {
    const method = order.paymentMethod || "unknown";
    if (!paymentMethods[method]) {
      paymentMethods[method] = {
        count: 0,
        total: 0,
      };
    }
    paymentMethods[method].count++;
    paymentMethods[method].total += order.totalAmount || 0;
  });

  // Get unique customers
  const uniqueCustomers = new Set(
    orders.map((order) => order.user?._id?.toString()).filter((id) => id),
  ).size;

  // Status distribution
  const statusDistribution = {};
  orders.forEach((order) => {
    const status = order.status || "unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  return {
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalItemsSold,
      uniqueCustomers,
      statusDistribution,
    },
    orders: orders.slice(0, 20), // Limit to 20 recent orders
    topProducts,
    paymentMethods,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  };
}

// Helper function to get period statistics
async function getPeriodStats(startDate, endDate) {
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" },
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    startDate,
    endDate,
  };
}

// Helper function to get top products
async function getTopProducts(limit) {
  const orders = await Order.find({
    status: { $ne: "cancelled" },
  }).populate("items.product", "name");

  const productSales = {};

  orders.forEach((order) => {
    if (order.items && order.items.length) {
      order.items.forEach((item) => {
        const productName = item.product?.name || "Unknown Product";
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSales[productName].totalQuantity += item.quantity || 0;
        productSales[productName].totalRevenue +=
          (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  return Object.values(productSales)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

// Helper function to get low stock products
async function getLowStockProducts() {
  try {
    const products = await Product.find({
      stock: { $lt: 10 },
    }).populate("category", "name");

    return products || [];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}

module.exports = reportController;
