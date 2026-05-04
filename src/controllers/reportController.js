const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

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
      res.status(500).json({
        success: false,
        message: "Failed to generate custom report",
        error: error.message,
      });
    }
  },

  // Download Report as Excel
  async downloadExcelReport(req, res) {
    try {
      const { startDate, endDate, reportType } = req.body;

      let start, end;

      if (reportType === "daily") {
        const date = startDate ? new Date(startDate) : new Date();
        start = new Date(date);
        start.setHours(0, 0, 0, 0);
        end = new Date(date);
        end.setHours(23, 59, 59, 999);
      } else if (reportType === "weekly") {
        let startDateObj = startDate ? new Date(startDate) : new Date();
        const dayOfWeek = startDateObj.getDay();
        startDateObj.setDate(startDateObj.getDate() - dayOfWeek);
        start = new Date(startDateObj);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }

      const reportData = await generateReport(start, end);

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();

      // Summary Sheet
      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 20 },
      ];

      summarySheet.addRows([
        {
          metric: "Report Period",
          value: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        },
        { metric: "Total Orders", value: reportData.summary.totalOrders },
        {
          metric: "Total Revenue",
          value: `$${reportData.summary.totalRevenue.toFixed(2)}`,
        },
        {
          metric: "Average Order Value",
          value: `$${reportData.summary.averageOrderValue.toFixed(2)}`,
        },
        {
          metric: "Total Items Sold",
          value: reportData.summary.totalItemsSold,
        },
        {
          metric: "Unique Customers",
          value: reportData.summary.uniqueCustomers,
        },
      ]);

      // Orders Sheet
      const ordersSheet = workbook.addWorksheet("Orders");
      ordersSheet.columns = [
        { header: "Order Number", key: "orderNumber", width: 20 },
        { header: "Date", key: "date", width: 20 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Total Amount", key: "totalAmount", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Payment Status", key: "paymentStatus", width: 15 },
        { header: "Items Count", key: "itemsCount", width: 12 },
      ];

      reportData.orders.forEach((order) => {
        ordersSheet.addRow({
          orderNumber: order.orderNumber,
          date: order.createdAt.toLocaleString(),
          customer: order.user?.name || "Guest",
          totalAmount: `$${order.totalAmount.toFixed(2)}`,
          status: order.status,
          paymentStatus: order.paymentStatus,
          itemsCount: order.items.length,
        });
      });

      // Top Products Sheet
      const productsSheet = workbook.addWorksheet("Top Products");
      productsSheet.columns = [
        { header: "Product Name", key: "name", width: 30 },
        { header: "Quantity Sold", key: "quantity", width: 15 },
        { header: "Revenue", key: "revenue", width: 15 },
      ];

      reportData.topProducts.forEach((product) => {
        productsSheet.addRow({
          name: product.name,
          quantity: product.totalQuantity,
          revenue: `$${product.totalRevenue.toFixed(2)}`,
        });
      });

      // Payment Methods Sheet
      const paymentSheet = workbook.addWorksheet("Payment Methods");
      paymentSheet.columns = [
        { header: "Payment Method", key: "method", width: 20 },
        { header: "Orders Count", key: "count", width: 15 },
        { header: "Total Amount", key: "amount", width: 15 },
      ];

      for (const [method, data] of Object.entries(reportData.paymentMethods)) {
        paymentSheet.addRow({
          method: method,
          count: data.count,
          amount: `$${data.total.toFixed(2)}`,
        });
      }

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report_${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Excel generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate Excel report",
        error: error.message,
      });
    }
  },

  // Download Report as PDF
  async downloadPdfReport(req, res) {
    try {
      const { startDate, endDate, reportType } = req.body;

      let start, end;

      if (reportType === "daily") {
        const date = startDate ? new Date(startDate) : new Date();
        start = new Date(date);
        start.setHours(0, 0, 0, 0);
        end = new Date(date);
        end.setHours(23, 59, 59, 999);
      } else if (reportType === "weekly") {
        let startDateObj = startDate ? new Date(startDate) : new Date();
        const dayOfWeek = startDateObj.getDay();
        startDateObj.setDate(startDateObj.getDate() - dayOfWeek);
        start = new Date(startDateObj);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }

      const reportData = await generateReport(start, end);

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report_${Date.now()}.pdf`,
      );

      doc.pipe(res);

      // Header
      doc
        .fontSize(20)
        .text("Cafe Management System Report", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `Report Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          { align: "center" },
        );
      doc.moveDown();

      // Summary Section
      doc.fontSize(16).text("Summary", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12);
      doc.text(`Total Orders: ${reportData.summary.totalOrders}`);
      doc.text(`Total Revenue: $${reportData.summary.totalRevenue.toFixed(2)}`);
      doc.text(
        `Average Order Value: $${reportData.summary.averageOrderValue.toFixed(2)}`,
      );
      doc.text(`Total Items Sold: ${reportData.summary.totalItemsSold}`);
      doc.text(`Unique Customers: ${reportData.summary.uniqueCustomers}`);
      doc.moveDown();

      // Top Products
      doc.fontSize(16).text("Top Selling Products", { underline: true });
      doc.moveDown(0.5);

      reportData.topProducts.slice(0, 10).forEach((product, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${product.name} - ${product.totalQuantity} sold ($${product.totalRevenue.toFixed(2)})`,
          );
      });
      doc.moveDown();

      // Payment Methods
      doc.fontSize(16).text("Payment Methods", { underline: true });
      doc.moveDown(0.5);

      for (const [method, data] of Object.entries(reportData.paymentMethods)) {
        doc
          .fontSize(12)
          .text(`${method}: ${data.count} orders ($${data.total.toFixed(2)})`);
      }
      doc.moveDown();

      // Recent Orders (Top 20)
      doc.fontSize(16).text("Recent Orders", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10);
      reportData.orders.slice(0, 20).forEach((order) => {
        doc.text(
          `${order.orderNumber} - ${order.createdAt.toLocaleDateString()} - $${order.totalAmount.toFixed(2)} - ${order.status}`,
        );
      });

      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF report",
        error: error.message,
      });
    }
  },

  // Get Dashboard Stats (Quick overview)
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
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard stats",
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
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate total items sold
  let totalItemsSold = 0;
  const productSales = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      totalItemsSold += item.quantity;

      const productName = item.product.name;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productSales[productName].totalQuantity += item.quantity;
      productSales[productName].totalRevenue += item.price * item.quantity;
    });
  });

  // Get top products
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  // Calculate payment methods distribution
  const paymentMethods = {};
  orders.forEach((order) => {
    if (!paymentMethods[order.paymentMethod]) {
      paymentMethods[order.paymentMethod] = {
        count: 0,
        total: 0,
      };
    }
    paymentMethods[order.paymentMethod].count++;
    paymentMethods[order.paymentMethod].total += order.totalAmount;
  });

  // Get unique customers
  const uniqueCustomers = new Set(
    orders.map((order) => order.user?._id?.toString()),
  ).size;

  // Status distribution
  const statusDistribution = {};
  orders.forEach((order) => {
    statusDistribution[order.status] =
      (statusDistribution[order.status] || 0) + 1;
  });

  // Hourly sales distribution (for daily report)
  const hourlySales = {};
  orders.forEach((order) => {
    const hour = order.createdAt.getHours();
    hourlySales[hour] = (hourlySales[hour] || 0) + order.totalAmount;
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
    orders: orders.sort((a, b) => b.createdAt - a.createdAt),
    topProducts,
    paymentMethods,
    hourlySales,
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
    (sum, order) => sum + order.totalAmount,
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
    order.items.forEach((item) => {
      const productName = item.product.name;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productSales[productName].totalQuantity += item.quantity;
      productSales[productName].totalRevenue += item.price * item.quantity;
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

// Helper function to get low stock products
async function getLowStockProducts() {
  const products = await Product.find({
    stock: { $lt: 10 },
  }).populate("category", "name");

  return products;
}

module.exports = reportController;
