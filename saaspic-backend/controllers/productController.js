const { resolveCategory } = require("../utils/categories");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Deal = require("../models/Deal");
const Review = require("../models/Review");
const Comparison = require("../models/Comparison");
const Blog = require("../models/Blog");
const AffiliateClick = require("../models/AffiliateClick");

// ======================================================
// SAFE PUBLIC PRODUCT
// ======================================================

const makePublicProduct = (product) => {
  const productObject = product.toObject
    ? product.toObject()
    : product;

  return {
    ...productObject,

    affiliate: {
      enabled:
        productObject.affiliate?.enabled === true,

      disclosureText:
        productObject.affiliate?.disclosureText || "",
    },
  };
};

// ======================================================
// CREATE PRODUCT
// ======================================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      website,
      logo,
      category,
      features,
      targetAudience,
      integrations,
      pricingInfo,
      strengths,
      limitations,
    } = req.body;

    if (
      !name ||
      !slug ||
      !description ||
      !website ||
      !category
    ) {
      return res.status(400).json({
        message:
          "Name, slug, description, website and category are required.",
      });
    }

    const categoryExists =
      await Category.findById(category);

    if (!categoryExists || !resolveCategory(categoryExists.slug)) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingProduct =
      await Product.findOne({
        slug: cleanSlug,
      });

    if (existingProduct) {
      return res.status(400).json({
        message:
          "A product with this slug already exists.",
      });
    }

    const product = await Product.create({
      name,
      slug: cleanSlug,
      description,
      shortDescription: shortDescription || "",
      website,
      logo: logo || "",
      category,
      features: Array.isArray(features)
        ? features
        : [],
      targetAudience:
        Array.isArray(targetAudience)
          ? targetAudience
          : [],
      integrations:
        Array.isArray(integrations)
          ? integrations
          : [],
      pricingInfo: pricingInfo || "",
      strengths:
        Array.isArray(strengths)
          ? strengths
          : [],
      limitations:
        Array.isArray(limitations)
          ? limitations
          : [],
    });

    const populatedProduct =
      await Product.findById(
        product._id
      ).populate("category");

    return res.status(201).json({
      message:
        "Product created successfully.",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    return res.status(500).json({
      message: "Could not create product.",
      error: error.message,
    });
  }
};

// ======================================================
// GET PUBLIC PRODUCTS
// ======================================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });

    const publicProducts =
      products.map(makePublicProduct);

    return res
      .status(200)
      .json(publicProducts);

  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      message: "Could not load products.",
    });
  }
};

// ======================================================
// GET PRODUCT BY SLUG
// ======================================================

const getProductBySlug = async (
  req,
  res
) => {
  try {
    const product =
      await Product.findOne({
        slug: req.params.slug,
      }).populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res
      .status(200)
      .json(
        makePublicProduct(product)
      );

  } catch (error) {
    console.error(
      "Get product by slug error:",
      error
    );

    return res.status(500).json({
      message: "Could not load product.",
    });
  }
};

// ======================================================
// ADMIN — GET PRODUCT BY ID
// ======================================================

const getProductByIdAdmin = async (
  req,
  res
) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      message: "Could not load product.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE PRODUCT
// ======================================================

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    if (req.body.lastKnownUpdatedAt && product.updatedAt) {
      const clientDate = new Date(req.body.lastKnownUpdatedAt).getTime();
      const serverDate = new Date(product.updatedAt).getTime();
      if (Math.abs(serverDate - clientDate) > 1000) {
        return res.status(409).json({
          message: "Conflict detected: this product was modified by another user while you were editing. Please refresh to view latest changes.",
          conflict: true,
          serverUpdatedAt: product.updatedAt,
        });
      }
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      website,
      logo,
      category,
      features,
      targetAudience,
      integrations,
      pricingInfo,
      strengths,
      limitations,
    } = req.body;

    if (category) {
      const categoryExists =
        await Category.findById(category);

      if (!categoryExists || !resolveCategory(categoryExists.slug)) {
        return res.status(404).json({
          message: "Category not found.",
        });
      }
    }

    if (slug) {
      const cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const duplicate =
        await Product.findOne({
          slug: cleanSlug,
          _id: {
            $ne: product._id,
          },
        });

      if (duplicate) {
        return res.status(400).json({
          message:
            "Another product already uses this slug.",
        });
      }

      product.slug = cleanSlug;
    }

    if (name !== undefined)
      product.name = name;

    if (description !== undefined)
      product.description = description;

    if (shortDescription !== undefined)
      product.shortDescription =
        shortDescription;

    if (website !== undefined)
      product.website = website;

    if (logo !== undefined)
      product.logo = logo;

    if (category !== undefined)
      product.category = category;

    if (Array.isArray(features))
      product.features = features;

    if (Array.isArray(targetAudience))
      product.targetAudience =
        targetAudience;

    if (Array.isArray(integrations))
      product.integrations =
        integrations;

    if (pricingInfo !== undefined)
      product.pricingInfo = pricingInfo;

    if (Array.isArray(strengths))
      product.strengths = strengths;

    if (Array.isArray(limitations))
      product.limitations = limitations;

    await product.save();

    const updatedProduct =
      await Product.findById(
        product._id
      ).populate("category");

    return res.status(200).json({
      message:
        "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    return res.status(500).json({
      message: "Could not update product.",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE PRODUCT
// ======================================================

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    // Prevent deleting products that still have deals
    const dealCount =
      await Deal.countDocuments({
        product: product._id,
      });

    if (dealCount > 0) {
      return res.status(400).json({
        message:
          "This product has deals. Delete its deals before deleting the product.",
      });
    }

    // Prevent deleting products that still have reviews
    const reviewCount =
      await Review.countDocuments({
        product: product._id,
      });

    if (reviewCount > 0) {
      return res.status(400).json({
        message:
          "This product has reviews. Delete its reviews before deleting the product.",
      });
    }
    const comparisonCount =
      await Comparison.countDocuments({
        $or: [
          { productA: product._id },
          { productB: product._id },
        ],
      });

    if (comparisonCount > 0) {
      return res.status(400).json({
        message:
          "This product is used in comparisons. Delete those comparisons before deleting the product.",
      });
    }
    const blogCount =
      await Blog.countDocuments({
        relatedProducts: product._id,
      });

    if (blogCount > 0) {
      return res.status(400).json({
        message:
          "This product is used in blogs. Remove it from those blogs before deleting the product.",
      });
    }
    await product.deleteOne();

    return res.status(200).json({
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    return res.status(500).json({
      message: "Could not delete product.",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductByIdAdmin,
  updateProduct,
  deleteProduct,
};