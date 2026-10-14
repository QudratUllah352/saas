const mongoose = require("mongoose");

const affiliateClickSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    source: {
      type: String,
      enum: [
        "deal",
        "review",
        "comparison",
        "blog",
        "homepage",
        "search",
        "other",
      ],
      default: "other",
    },

    userAgent: {
      type: String,
      default: "",
    },

    referrer: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

affiliateClickSchema.index({ product: 1 });
affiliateClickSchema.index({ createdAt: 1 });

const AffiliateClick = mongoose.model(
  "AffiliateClick",
  affiliateClickSchema
);

module.exports = AffiliateClick;
