const Product = require("../models/Product");
const Category = require("../models/Category");

const productController = {
  // Create product (Admin/Manager only)
  async createProduct(req, res) {
    try {
      const { name, description, price, category, stock, image } = req.body;

      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }

      const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        image,
      });

      await product.save();

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
    }
  },

  // Get all products
  async getAllProducts(req, res) {
    try {
      const { category, isAvailable, search } = req.query;
      let filter = {};

      if (category) filter.category = category;
      if (isAvailable !== undefined)
        filter.isAvailable = isAvailable === "true";
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const products = await Product.find(filter).populate("category", "name");

      res.json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
    }
  },

  // Get single product
  async getProductById(req, res) {
    try {
      const product = await Product.findById(req.params.id).populate(
        "category",
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch product",
        error: error.message,
      });
    }
  },

  // Update product (Admin/Manager only)
  async updateProduct(req, res) {
    try {
      const updates = req.body;
      const product = await Product.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
    }
  },

  // Delete product (Admin only)
  async deleteProduct(req, res) {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete product",
        error: error.message,
      });
    }
  },

  // Update stock
  async updateStock(req, res) {
    try {
      const { stock } = req.body;
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { stock },
        { new: true },
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        message: "Stock updated successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update stock",
        error: error.message,
      });
    }
  },
};

module.exports = productController;
