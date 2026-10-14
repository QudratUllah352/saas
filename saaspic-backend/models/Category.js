const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    isMain: { type: Boolean, default: false },
    migratedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    name: {
      type: String,
      required: true,
      unique: true,
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
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
