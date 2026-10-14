const mongoose = require("mongoose");


// ==========================================
// RATING BREAKDOWN
// ==========================================

const ratingBreakdownSchema =
  new mongoose.Schema(
    {
      features: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },

      easeOfUse: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },

      valueForMoney: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },

      support: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );


// ==========================================
// FEATURE
// ==========================================

const featureSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
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
// PRICING PLAN
// ==========================================

const pricingPlanSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      price: {
        type: String,
        required: true,
        trim: true,
      },

      billing: {
        type: String,
        default: "",
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      features: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );


// ==========================================
// REVIEW
// ==========================================

const reviewSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      deal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        default: null,
      },

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


      // ====================================
      // RATINGS
      // ====================================

      overallRating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
      },

      ratingBreakdown: {
        type: ratingBreakdownSchema,
        default: () => ({}),
      },


      // ====================================
      // QUICK SUMMARY
      // ====================================

      quickVerdict: {
        type: String,
        required: true,
        trim: true,
      },

      topPros: {
        type: [String],
        default: [],
      },

      biggestLimitation: {
        type: String,
        default: "",
        trim: true,
      },


      // ====================================
      // PRODUCT INFORMATION
      // ====================================

      overview: {
        type: String,
        required: true,
        trim: true,
      },

      targetAudience: {
        type: [String],
        default: [],
      },


      // ====================================
      // FEATURES
      // ====================================

      features: {
        type: [featureSchema],
        default: [],
      },


      // ====================================
      // PRICING
      // ====================================

      pricingPlans: {
        type: [pricingPlanSchema],
        default: [],
      },


      // ====================================
      // PROS / CONS
      // ====================================

      pros: {
        type: [String],
        default: [],
      },

      cons: {
        type: [String],
        default: [],
      },


      // ====================================
      // ALTERNATIVES
      // ====================================

      alternatives: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],


      // ====================================
      // FINAL VERDICT
      // ====================================

      verdict: {
        type: String,
        required: true,
        trim: true,
      },


      // ====================================
      // ARTICLE INFORMATION
      // ====================================

      author: {
        type: String,
        default: "SaaSPic Team",
        trim: true,
      },

      readTime: {
        type: Number,
        default: 5,
        min: 1,
      },

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

const Review =
  mongoose.model(
    "Review",
    reviewSchema
  );

module.exports = Review;