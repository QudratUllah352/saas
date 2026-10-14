const mongoose = require("mongoose");
const { validateOfferDates } = require("../utils/dealDates");

const dealSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    discount: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    dealUrl: {
      type: String,
      required: true,
      trim: true,
    },

    dealType: {
      type: String,
      enum: ["lifetime", "annual", "monthly", "other"],
      default: "other",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

dealSchema.pre("validate", function () {
  try { validateOfferDates(this.startDate, this.endDate); }
  catch (error) { this.invalidate("endDate", error.message); }
});
const Deal = mongoose.model("Deal", dealSchema);

module.exports = Deal;
