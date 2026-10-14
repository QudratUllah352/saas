const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
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

    description: {
      type: String,
      required: true,
      trim: true,
    },

    website: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // --------------------------------------
    // EXTRA PRODUCT INFORMATION FOR REVIEWS
    // --------------------------------------

    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },

    features: {
      type: [String],
      default: [],
    },

    targetAudience: {
      type: [String],
      default: [],
    },

    integrations: {
      type: [String],
      default: [],
    },

    pricingInfo: {
      type: String,
      default: "",
      trim: true,
    },

    strengths: {
      type: [String],
      default: [],
    },

    limitations: {
      type: [String],
      default: [],
    },

    affiliate: {
      enabled: {
        type: Boolean,
        default: false,
      },

      url: {
        type: String,
        default: "",
        trim: true,
      },

      programName: {
        type: String,
        default: "",
        trim: true,
      },

      network: {
        type: String,
        default: "",
        trim: true,
      },

      commissionType: {
        type: String,
        enum: [
          "percentage",
          "fixed",
          "recurring",
          "unknown",
        ],
        default: "unknown",
      },

      commissionValue: {
        type: String,
        default: "",
        trim: true,
      },

      disclosureText: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model(
  "Product",
  productSchema
);

module.exports = Product;