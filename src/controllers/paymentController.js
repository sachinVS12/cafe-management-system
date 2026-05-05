const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const QRCode = require("qrcode");
const pdf = require("html-pdf-node");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const paymentController = {
  // Process payment for an order
  async processPayment(req, res) {
    try {
      const { orderId, paymentMethod, paymentDetails, notes } = req.body;

      // Find order
      const order =
        await Order.findById(orderId).populate("user items.product");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if order is already paid
      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "Order is already paid",
        });
      }

      // Check if order is cancelled
      if (order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Cannot process payment for cancelled order",
        });
      }

      // Generate payment ID
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create payment record
      const payment = new Payment({
        paymentId,
        orderId: order._id,
        userId: order.user._id,
        amount: order.totalAmount,
        paymentMethod,
        paymentStatus: "completed",
        notes,
        processedBy: req.user._id,
      });

      // Add payment method specific details
      switch (paymentMethod) {
        case "cash":
          payment.cashDetails = {
            amountReceived: paymentDetails.amountReceived,
            amountReturned: paymentDetails.amountReceived - order.totalAmount,
            receivedBy: req.user.name,
          };
          break;
        case "card":
          payment.cardDetails = {
            cardType: paymentDetails.cardType,
            lastFourDigits: paymentDetails.lastFourDigits,
            cardHolderName: paymentDetails.cardHolderName,
          };
          payment.transactionId = paymentDetails.transactionId || uuidv4();
          break;
        case "upi":
          payment.upiDetails = {
            upiId: paymentDetails.upiId,
            transactionRef: paymentDetails.transactionRef || uuidv4(),
          };
          payment.transactionId = paymentDetails.transactionRef || uuidv4();
          break;
        case "online":
          payment.transactionId = paymentDetails.transactionId || uuidv4();
          break;
      }

      await payment.save();

      // Update order payment status
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.updatedAt = Date.now();
      await order.save();

      res.json({
        success: true,
        message: "Payment processed successfully",
        payment: {
          paymentId: payment.paymentId,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
        },
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process payment",
        error: error.message,
      });
    }
  },

  // Generate QR code for UPI payment
  async generateUPIQR(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // UPI payment details
      const upiId = "cafe@payments"; // Your UPI ID
      const payeeName = "Cafe Management System";
      const amount = order.totalAmount;
      const transactionNote = `Payment for order ${order.orderNumber}`;

      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        scale: 8,
      });

      res.json({
        success: true,
        qrCode: qrCodeDataUrl,
        upiId,
        amount,
        orderNumber: order.orderNumber,
      });
    } catch (error) {
      console.error("QR generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message,
      });
    }
  },

  // Verify UPI payment (mock - integrate with actual UPI API)
  async verifyUPIPayment(req, res) {
    try {
      const { orderId, transactionRef } = req.body;

      // In production, verify with UPI API
      // For demo, we'll simulate verification

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Simulate payment verification
      const paymentVerified = true;

      if (paymentVerified) {
        // Create payment record
        const payment = new Payment({
          paymentId: `PAY-${Date.now()}`,
          orderId: order._id,
          userId: order.user._id,
          amount: order.totalAmount,
          paymentMethod: "upi",
          paymentStatus: "completed",
          transactionId: transactionRef,
          upiDetails: {
            upiId: "customer@upi",
            transactionRef,
          },
          processedBy: req.user._id,
        });

        await payment.save();

        // Update order
        order.paymentStatus = "paid";
        order.status = "confirmed";
        await order.save();

        res.json({
          success: true,
          message: "Payment verified successfully",
          receiptNumber: payment.receiptNumber,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error: error.message,
      });
    }
  },

  // Generate and download receipt
  async downloadReceipt(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findOne({ paymentId })
        .populate("orderId")
        .populate("userId")
        .populate("processedBy");

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const order = payment.orderId;
      await order.populate("items.product");

      // Generate receipt HTML
      const receiptHtml = await generateReceiptHTML(payment, order);

      // PDF options
      const options = {
        format: "A4",
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
      };

      // Generate PDF
      const file = { content: receiptHtml };
      const pdfBuffer = await pdf.generatePdf(file, options);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=receipt_${payment.receiptNumber}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Receipt generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate receipt",
        error: error.message,
      });
    }
  },

  // Get payment details
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findOne({ paymentId })
        .populate("orderId")
        .populate("userId", "name email phone")
        .populate("processedBy", "name");

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.json({
        success: true,
        payment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment details",
        error: error.message,
      });
    }
  },

  // Get payment history for an order
  async getOrderPayments(req, res) {
    try {
      const { orderId } = req.params;

      const payments = await Payment.find({ orderId })
        .populate("userId", "name email")
        .populate("processedBy", "name")
        .sort("-paymentDate");

      res.json({
        success: true,
        count: payments.length,
        payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: error.message,
      });
    }
  },

  // Process refund
  async processRefund(req, res) {
    try {
      const { paymentId, reason } = req.body;

      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      if (payment.paymentStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Only completed payments can be refunded",
        });
      }

      // Process refund based on payment method
      // In production, integrate with payment gateway

      payment.paymentStatus = "refunded";
      payment.notes = `${payment.notes || ""} Refunded: ${reason}`;
      await payment.save();

      // Update order
      const order = await Order.findById(payment.orderId);
      order.paymentStatus = "refunded";
      order.status = "cancelled";
      await order.save();

      // Restore product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      res.json({
        success: true,
        message: "Refund processed successfully",
        refundAmount: payment.amount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to process refund",
        error: error.message,
      });
    }
  },

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let filter = { paymentStatus: "completed" };
      if (startDate && endDate) {
        filter.paymentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const payments = await Payment.find(filter);

      const stats = {
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        totalPayments: payments.length,
        byMethod: {},
        recentPayments: payments.slice(-10).reverse(),
      };

      // Group by payment method
      payments.forEach((payment) => {
        if (!stats.byMethod[payment.paymentMethod]) {
          stats.byMethod[payment.paymentMethod] = {
            count: 0,
            amount: 0,
          };
        }
        stats.byMethod[payment.paymentMethod].count++;
        stats.byMethod[payment.paymentMethod].amount += payment.amount;
      });

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment statistics",
        error: error.message,
      });
    }
  },
};

// Helper function to generate receipt HTML
async function generateReceiptHTML(payment, order) {
  const date = new Date(payment.paymentDate);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: #fff;
          padding: 20px;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 28px;
          color: #333;
          margin-bottom: 5px;
        }
        
        .header p {
          color: #666;
          font-size: 12px;
        }
        
        .receipt-title {
          text-align: center;
          margin: 20px 0;
        }
        
        .receipt-title h2 {
          font-size: 24px;
          color: #4CAF50;
        }
        
        .receipt-info {
          background: #f5f5f5;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .info-label {
          font-weight: bold;
          color: #555;
        }
        
        .info-value {
          color: #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th {
          background: #f5f5f5;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .total-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #333;
          text-align: right;
        }
        
        .total-row {
          margin-bottom: 10px;
        }
        
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #4CAF50;
        }
        
        .payment-details {
          background: #e8f5e9;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        .thankyou {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          color: #4CAF50;
          margin: 20px 0;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .receipt-container {
            border: none;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>☕ Cafe Management System</h1>
          <p>123 Coffee Street, Food District, City - 123456</p>
          <p>Phone: +91 1234567890 | Email: info@cafe.com</p>
          <p>GST: 1234567890</p>
        </div>
        
        <div class="receipt-title">
          <h2>PAYMENT RECEIPT</h2>
        </div>
        
        <div class="receipt-info">
          <div class="info-row">
            <span class="info-label">Receipt Number:</span>
            <span class="info-value">${payment.receiptNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment ID:</span>
            <span class="info-value">${payment.paymentId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Number:</span>
            <span class="info-value">${order.orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date & Time:</span>
            <span class="info-value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer Name:</span>
            <span class="info-value">${payment.userId.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer Email:</span>
            <span class="info-value">${payment.userId.email}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <strong>Subtotal:</strong> ₹${order.totalAmount.toFixed(2)}
          </div>
          <div class="total-row">
            <strong>Tax (5% GST):</strong> ₹${(order.totalAmount * 0.05).toFixed(2)}
          </div>
          <div class="total-row grand-total">
            <strong>Grand Total:</strong> ₹${(order.totalAmount * 1.05).toFixed(2)}
          </div>
        </div>
        
        <div class="payment-details">
          <h3>Payment Details</h3>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${payment.paymentMethod.toUpperCase()}</span>
          </div>
          ${
            payment.paymentMethod === "cash"
              ? `
            <div class="info-row">
              <span class="info-label">Amount Received:</span>
              <span class="info-value">₹${payment.cashDetails?.amountReceived?.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Amount Returned:</span>
              <span class="info-value">₹${payment.cashDetails?.amountReturned?.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Received By:</span>
              <span class="info-value">${payment.cashDetails?.receivedBy}</span>
            </div>
          `
              : payment.paymentMethod === "card"
                ? `
            <div class="info-row">
              <span class="info-label">Card Type:</span>
              <span class="info-value">${payment.cardDetails?.cardType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Card Number:</span>
              <span class="info-value">**** **** **** ${payment.cardDetails?.lastFourDigits}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Card Holder:</span>
              <span class="info-value">${payment.cardDetails?.cardHolderName}</span>
            </div>
          `
                : payment.paymentMethod === "upi"
                  ? `
            <div class="info-row">
              <span class="info-label">UPI ID:</span>
              <span class="info-value">${payment.upiDetails?.upiId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Ref:</span>
              <span class="info-value">${payment.upiDetails?.transactionRef}</span>
            </div>
          `
                  : ""
          }
          ${
            payment.transactionId
              ? `
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${payment.transactionId}</span>
            </div>
          `
              : ""
          }
          <div class="info-row">
            <span class="info-label">Payment Status:</span>
            <span class="info-value" style="color: #4CAF50;">${payment.paymentStatus.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="thankyou">
          Thank you for your business!
        </div>
        
        <div class="footer">
          <p>This is a computer generated receipt and does not require signature.</p>
          <p>For any queries, please contact us within 7 days.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = paymentController;
