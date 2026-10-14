const express = require("express");

const {
  generateBlog,
} = require("../controllers/aiBlogController");

const adminAuth =
  require("../middleware/adminAuth");

const router = express.Router();

router.post(
  "/generate",
  adminAuth,
  generateBlog
);

module.exports = router;