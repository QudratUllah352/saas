const express = require("express");

const {
  generateComparison,
} = require(
  "../controllers/aiComparisonController"
);

const adminAuth =
  require("../middleware/adminAuth");

const router = express.Router();

// ADMIN ONLY
router.post(
  "/generate",
  adminAuth,
  generateComparison
);

module.exports = router;