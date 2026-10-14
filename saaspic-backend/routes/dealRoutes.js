const express = require("express");

const {
  createDeal,
  getDeals,
  getDealById,
  getDealsByCategory,
  getAllDealsAdmin,
  getDealByIdAdmin,
  updateDeal,
  toggleDealStatus,
  deleteDeal,
} = require("../controllers/dealController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ==============================
// PUBLIC ROUTES
// ==============================

router.get("/", getDeals);

router.get(
  "/category/:slug",
  getDealsByCategory
);

router.get("/:id", getDealById);


// ==============================
// ADMIN ROUTES
// ==============================

router.post(
  "/",
  adminAuth,
  createDeal
);

router.get(
  "/admin/all",
  adminAuth,
  getAllDealsAdmin
);

router.get(
  "/admin/:id",
  adminAuth,
  getDealByIdAdmin
);

router.patch(
  "/:id",
  adminAuth,
  updateDeal
);

router.patch(
  "/:id/status",
  adminAuth,
  toggleDealStatus
);

router.delete(
  "/:id",
  adminAuth,
  deleteDeal
);


module.exports = router;