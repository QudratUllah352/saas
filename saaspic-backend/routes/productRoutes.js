const express = require("express");

const {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductByIdAdmin,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const adminAuth = require(
  "../middleware/adminAuth"
);

const router = express.Router();
const { generateProduct } = require('../controllers/aiProductController');
router.post('/ai/generate', adminAuth, generateProduct);

// ============================================
// PUBLIC
// ============================================

router.get("/", getProducts);

// ============================================
// ADMIN
// Keep these BEFORE /:slug
// ============================================

router.get(
  "/admin/:id",
  adminAuth,
  getProductByIdAdmin
);

router.post(
  "/",
  adminAuth,
  createProduct
);

router.patch(
  "/:id",
  adminAuth,
  updateProduct
);

router.delete(
  "/:id",
  adminAuth,
  deleteProduct
);

// ============================================
// PUBLIC SINGLE PRODUCT
// Keep this LAST
// ============================================

router.get(
  "/:slug",
  getProductBySlug
);

module.exports = router;
