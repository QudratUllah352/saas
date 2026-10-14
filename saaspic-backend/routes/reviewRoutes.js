const express = require("express");

const {
  createReview,
  getReviews,
  getReviewBySlug,
  getAllReviewsAdmin,
  getReviewByIdAdmin,
  updateReview,
  toggleReviewPublish,
  deleteReview,
} = require("../controllers/reviewController");

const adminAuth =
  require("../middleware/adminAuth");

const router = express.Router();


// ==========================================
// PUBLIC ROUTES
// ==========================================

// All published reviews
router.get("/", getReviews);


// ==========================================
// ADMIN ROUTES
// ==========================================

// All reviews including drafts
router.get(
  "/admin/all",
  adminAuth,
  getAllReviewsAdmin
);

// Single review including draft
router.get(
  "/admin/:id",
  adminAuth,
  getReviewByIdAdmin
);

// Create review draft
router.post(
  "/",
  adminAuth,
  createReview
);

// Edit review
router.patch(
  "/:id",
  adminAuth,
  updateReview
);

// Publish / unpublish
router.patch(
  "/:id/status",
  adminAuth,
  toggleReviewPublish
);

// Delete
router.delete(
  "/:id",
  adminAuth,
  deleteReview
);


// ==========================================
// PUBLIC SINGLE REVIEW
// Keep this LAST
// ==========================================

router.get(
  "/:slug",
  getReviewBySlug
);


module.exports = router;