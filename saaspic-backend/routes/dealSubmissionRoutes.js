const express = require("express");

const {
  createDealSubmission,
  getDealSubmissions,
  approveDealSubmission,
  rejectDealSubmission,
  publishDealSubmission,
} = require("../controllers/dealSubmissionController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Public route
router.post("/", createDealSubmission);

// Admin routes
router.get("/", adminAuth, getDealSubmissions);

router.patch(
  "/:id/approve",
  adminAuth,
  approveDealSubmission
);

router.patch(
  "/:id/reject",
  adminAuth,
  rejectDealSubmission
);

router.post(
  "/:id/publish",
  adminAuth,
  publishDealSubmission
);

module.exports = router;