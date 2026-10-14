const express = require("express");

const {
  redirectToAffiliate,
  getAffiliateStats,
  getAffiliateProducts,
  updateAffiliateSettings,
} = require("../controllers/affiliateController");

const adminAuth = require("../middleware/adminAuth");
const { requireRole } = require("../middleware/adminAuth");

const router = express.Router();

/* ==============================
   PUBLIC
============================== */

router.get("/go/:productId", redirectToAffiliate);

/* ==============================
   ADMIN / SUPER ADMIN ONLY
   (Restricted from Editors)
============================== */

router.get(
  "/admin/products",
  adminAuth,
  requireRole("superadmin", "admin"),
  getAffiliateProducts
);

router.patch(
  "/admin/products/:productId",
  adminAuth,
  requireRole("superadmin", "admin"),
  updateAffiliateSettings
);

router.get(
  "/stats",
  adminAuth,
  requireRole("superadmin", "admin"),
  getAffiliateStats
);

module.exports = router;