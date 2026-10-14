const express = require("express");

const {
  createComparison,
  getComparisons,
  getComparisonBySlug,
  getAllComparisonsAdmin,
  getComparisonByIdAdmin,
  updateComparison,
  toggleComparisonPublish,
  deleteComparison,
} = require("../controllers/comparisonController");

const adminAuth =
  require("../middleware/adminAuth");

const router = express.Router();

// PUBLIC
router.get("/", getComparisons);

// ADMIN
router.get(
  "/admin/all",
  adminAuth,
  getAllComparisonsAdmin
);

router.get(
  "/admin/:id",
  adminAuth,
  getComparisonByIdAdmin
);

router.post(
  "/",
  adminAuth,
  createComparison
);

router.patch(
  "/:id",
  adminAuth,
  updateComparison
);

router.patch(
  "/:id/status",
  adminAuth,
  toggleComparisonPublish
);

router.delete(
  "/:id",
  adminAuth,
  deleteComparison
);

// PUBLIC SINGLE
// IMPORTANT: keep this LAST
router.get(
  "/:slug",
  getComparisonBySlug
);

module.exports = router;