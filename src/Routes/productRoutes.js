const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { validate, productValidations } = require("../middleware/validation");

// Public routes (all authenticated users)
router.get("/", authMiddleware, productController.getAllProducts);
router.get("/:id", authMiddleware, productController.getProductById);

// Admin/Manager only routes
router.post(
  "/",
  authMiddleware,
  roleCheck("admin", "manager"),
  validate(productValidations.create),
  productController.createProduct,
);

router.put(
  "/:id",
  authMiddleware,
  roleCheck("admin", "manager"),
  productController.updateProduct,
);

router.patch(
  "/:id/stock",
  authMiddleware,
  roleCheck("admin", "manager"),
  productController.updateStock,
);

router.delete(
  "/:id",
  authMiddleware,
  roleCheck("admin"),
  productController.deleteProduct,
);

module.exports = router;
