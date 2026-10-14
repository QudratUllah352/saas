const mongoose = require("mongoose");

const blogSectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
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

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "SaaS",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    sections: {
      type: [blogSectionSchema],
      default: [],
    },

    conclusion: {
      type: String,
      required: true,
      trim: true,
    },

    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

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

const Blog = mongoose.model(
  "Blog",
  blogSchema
);

module.exports = Blog;