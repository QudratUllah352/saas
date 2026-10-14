const express = require("express");

const {
  createCategory,
  getCategories,
} = require("../controllers/categoryController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.post("/", adminAuth, createCategory);

router.get("/", getCategories);

module.exports = router;