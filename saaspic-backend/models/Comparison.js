const mongoose = require("mongoose");

// ==========================================
// COMPARISON POINT SCHEMA
// Example:
// Feature        TaskPilot AI       TaskFlow
// AI Planning    Available          Not listed
// ==========================================

const comparisonPointSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    productA: {
      type: String,
      required: true,
      trim: true,
    },

    productB: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// COMPARISON SCHEMA
// ==========================================

const comparisonSchema = new mongoose.Schema(
  {
    // --------------------------------------
    // BASIC INFORMATION
    // --------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
    },

    introduction: {
      type: String,
      required: true,
      trim: true,
    },

    // --------------------------------------
    // PRODUCTS
    // --------------------------------------

    productA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // --------------------------------------
    // COMPARISON TABLE
    // --------------------------------------

    comparisonPoints: {
      type: [comparisonPointSchema],
      default: [],
    },

    // --------------------------------------
    // BEST FOR
    // --------------------------------------

    productABestFor: {
      type: [String],
      default: [],
    },

    productBBestFor: {
      type: [String],
      default: [],
    },

    // --------------------------------------
    // STRENGTHS
    // --------------------------------------

    productAStrengths: {
      type: [String],
      default: [],
    },

    productBStrengths: {
      type: [String],
      default: [],
    },

    // --------------------------------------
    // LIMITATIONS
    // --------------------------------------

    productALimitations: {
      type: [String],
      default: [],
    },

    productBLimitations: {
      type: [String],
      default: [],
    },

    // --------------------------------------
    // FINAL CONCLUSION
    // --------------------------------------

    conclusion: {
      type: String,
      required: true,
      trim: true,
    },

    // --------------------------------------
    // AUTHOR INFORMATION
    // --------------------------------------

    author: {
      type: String,
      default: "SaaSpin Team",
      trim: true,
    },

    readTime: {
      type: Number,
      default: 5,
      min: 1,
    },

    // --------------------------------------
    // PUBLISHING
    // --------------------------------------

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// MODEL
// ==========================================

const Comparison = mongoose.model(
  "Comparison",
  comparisonSchema
);

module.exports = Comparison;