const express = require("express");

const {
    generateReview,
} = require("../controllers/aiReviewController");

const adminAuth =
    require("../middleware/adminAuth");

const router = express.Router();

router.post(
    "/reviews/generate",
    adminAuth,
    generateReview
);

module.exports = router;