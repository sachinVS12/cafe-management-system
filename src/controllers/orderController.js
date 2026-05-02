const Order = require("../models/Order");
const Product = require("../models/Product");

const orderController = {
  // Create new order
  async createOrder(req, res) {
    try {
      const { items, paymentMethod, specialInstructions } = req.body;

      // Validate items and calculate total
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product ${item.product} not found`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
        }

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
        });

        totalAmount += product.price * item.quantity;

        // Update stock
        product.stock -= item.quantity;
        await product.save();
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const order = new Order({
        orderNumber,
        user: req.user._id,
        items: orderItems,
        totalAmount,
        paymentMethod,
        specialInstructions,
      });

      await order.save();

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
    }
  },

  // Get user's orders
  async getUserOrders(req, res) {
    try {
      const orders = await Order.find({ user: req.user._id })
        .populate("items.product", "name price")
        .sort("-createdAt");

      res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  },

  // Get all orders (Admin/Manager only)
  async getAllOrders(req, res) {
    try {
      const { status, startDate, endDate } = req.query;
      let filter = {};

      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const orders = await Order.find(filter)
        .populate("user", "name email")
        .populate("items.product", "name price")
        .sort("-createdAt");

      res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  },

  // Get single order
  async getOrderById(req, res) {
    try {
      const order = await Order.findById(req.params.id)
        .populate("user", "name email phone")
        .populate("items.product", "name price image");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check authorization
      if (
        req.user.role === "customer" &&
        order.user._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch order",
        error: error.message,
      });
    }
  },

  // Update order status (Admin/Manager/Staff only)
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: Date.now() },
        { new: true },
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
    }
  },

  // Update payment status (Admin/Manager only)
  async updatePaymentStatus(req, res) {
    try {
      const { paymentStatus } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { paymentStatus, updatedAt: Date.now() },
        { new: true },
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Payment status updated successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update payment status",
        error: error.message,
      });
    }
  },

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if order can be cancelled
      if (order.status !== "pending" && order.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled at this stage",
        });
      }

      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      order.status = "cancelled";
      order.updatedAt = Date.now();
      await order.save();

      res.json({
        success: true,
        message: "Order cancelled successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to cancel order",
        error: error.message,
      });
    }
  },
};

module.exports = orderController;
