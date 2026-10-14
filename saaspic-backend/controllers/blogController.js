const Blog = require("../models/Blog");
const Product = require("../models/Product");
const publicProductSelect =
  require("../utils/publicProductSelect");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==========================================
// PUBLIC BLOG POPULATION
// ==========================================

function populatePublicBlog(query) {
  return query.populate({
    path: "relatedProducts",

    select: publicProductSelect,

    populate: {
      path: "category",
      select: "name slug",
    },
  });
}


// ==========================================
// ADMIN BLOG POPULATION
// ==========================================

function populateAdminBlog(query) {
  return query.populate({
    path: "relatedProducts",

    populate: {
      path: "category",
      select: "name slug",
    },
  });
}

// ==========================================
// CREATE BLOG
// ==========================================

const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      introduction,
      coverImage,
      category,
      tags,
      sections,
      conclusion,
      relatedProducts,
      author,
      readTime,
    } = req.body;

    if (
      !title ||
      !excerpt ||
      !introduction ||
      !conclusion
    ) {
      return res.status(400).json({
        message:
          "Title, excerpt, introduction and conclusion are required.",
      });
    }

    const finalSlug = slugify(
      slug || title
    );

    if (!finalSlug) {
      return res.status(400).json({
        message: "Invalid blog slug.",
      });
    }

    const duplicate =
      await Blog.findOne({
        slug: finalSlug,
      });

    if (duplicate) {
      return res.status(400).json({
        message:
          "A blog with this slug already exists.",
      });
    }

    const productIds =
      Array.isArray(relatedProducts)
        ? relatedProducts
        : [];

    if (productIds.length > 0) {
      const products =
        await Product.find({
          _id: { $in: productIds },
        });

      if (
        products.length !==
        productIds.length
      ) {
        return res.status(400).json({
          message:
            "One or more related products are invalid.",
        });
      }
    }

    const blog = await Blog.create({
      title,
      slug: finalSlug,
      excerpt,
      introduction,

      coverImage:
        coverImage || "",

      category:
        category || "SaaS",

      tags:
        Array.isArray(tags)
          ? tags
          : [],

      sections:
        Array.isArray(sections)
          ? sections
          : [],

      conclusion,

      relatedProducts:
        productIds,

      author:
        author || "SaaSpin Team",

      readTime:
        Number(readTime) || 5,

      // ALWAYS CREATE AS DRAFT
      isPublished: false,
      publishedAt: null,
    });

    const populated =
      await populateAdminBlog(
        Blog.findById(blog._id)
      );

    res.status(201).json({
      message:
        "Blog saved as draft.",
      blog: populated,
    });
  } catch (error) {
    console.error(
      "Create blog error:",
      error
    );

    res.status(500).json({
      message:
        "Could not create blog.",
      error: error.message,
    });
  }
};

// ==========================================
// PUBLIC BLOG LIST
// ==========================================

const getBlogs = async (req, res) => {
  try {
    const blogs =
      await populatePublicBlog(
        Blog.find({
          isPublished: true,
        }).sort({
          publishedAt: -1,
          createdAt: -1,
        })
      );

    res.json(blogs);
  } catch (error) {
    console.error(
      "Get blogs error:",
      error
    );

    res.status(500).json({
      message:
        "Could not fetch blogs.",
    });
  }
};

// ==========================================
// PUBLIC BLOG BY SLUG
// ==========================================
const getBlogBySlug = async (
  req,
  res
) => {
  try {
    const blog =
      await populatePublicBlog(
        Blog.findOne({
          slug: req.params.slug,
          isPublished: true,
        })
      );

    if (!blog) {
      return res.status(404).json({
        message:
          "Blog not found.",
      });
    }

    return res.json(blog);

  }catch (error) {
    console.error(
      "Get blog error:",
      error
    );

    return res.status(500).json({
      message:
        "Could not fetch blog.",
    });
  }
};
// ==========================================
// ADMIN - ALL BLOGS
// ==========================================

const getAllBlogsAdmin = async (
  req,
  res
) => {
  try {
    const blogs =
      await populateAdminBlog(
        Blog.find().sort({
          createdAt: -1,
        })
      );

    res.json(blogs);
  } catch (error) {
    console.error(
      "Admin blogs error:",
      error
    );

    res.status(500).json({
      message:
        "Could not fetch blogs.",
    });
  }
};

// ==========================================
// ADMIN - BLOG BY ID
// ==========================================

const getBlogByIdAdmin = async (
  req,
  res
) => {
  try {
    const blog =
      await populateAdminBlog(
        Blog.findById(req.params.id)
      );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found.",
      });
    }

    res.json(blog);
  } catch (error) {
    console.error(
      "Get admin blog error:",
      error
    );

    res.status(500).json({
      message:
        "Could not fetch blog.",
    });
  }
};

// ==========================================
// UPDATE BLOG
// ==========================================

const updateBlog = async (
  req,
  res
) => {
  try {
    const blog =
      await Blog.findById(
        req.params.id
      );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found.",
      });
    }

    if (req.body.lastKnownUpdatedAt && blog.updatedAt) {
      const clientDate = new Date(req.body.lastKnownUpdatedAt).getTime();
      const serverDate = new Date(blog.updatedAt).getTime();
      if (Math.abs(serverDate - clientDate) > 1000) {
        return res.status(409).json({
          message: "Conflict detected: this blog was modified by another user while you were editing. Please refresh to view latest changes.",
          conflict: true,
          serverUpdatedAt: blog.updatedAt,
        });
      }
    }

    const {
      title,
      slug,
      excerpt,
      introduction,
      coverImage,
      category,
      tags,
      sections,
      conclusion,
      relatedProducts,
      author,
      readTime,
    } = req.body;

    if (title !== undefined) {
      blog.title = title;
    }

    if (slug !== undefined) {
      const finalSlug =
        slugify(slug);

      if (!finalSlug) {
        return res.status(400).json({
          message:
            "Invalid blog slug.",
        });
      }

      const duplicate =
        await Blog.findOne({
          slug: finalSlug,
          _id: { $ne: blog._id },
        });

      if (duplicate) {
        return res.status(400).json({
          message:
            "A blog with this slug already exists.",
        });
      }

      blog.slug = finalSlug;
    }

    if (excerpt !== undefined) {
      blog.excerpt = excerpt;
    }

    if (introduction !== undefined) {
      blog.introduction =
        introduction;
    }

    if (coverImage !== undefined) {
      blog.coverImage =
        coverImage;
    }

    if (category !== undefined) {
      blog.category = category;
    }

    if (Array.isArray(tags)) {
      blog.tags = tags;
    }

    if (Array.isArray(sections)) {
      blog.sections = sections;
    }

    if (conclusion !== undefined) {
      blog.conclusion =
        conclusion;
    }

    if (
      Array.isArray(
        relatedProducts
      )
    ) {
      if (
        relatedProducts.length > 0
      ) {
        const products =
          await Product.find({
            _id: {
              $in: relatedProducts,
            },
          });

        if (
          products.length !==
          relatedProducts.length
        ) {
          return res.status(400).json({
            message:
              "One or more related products are invalid.",
          });
        }
      }

      blog.relatedProducts =
        relatedProducts;
    }

    if (author !== undefined) {
      blog.author = author;
    }

    if (readTime !== undefined) {
      blog.readTime =
        Number(readTime) || 5;
    }

    await blog.save();

    const populated =
      await populateAdminBlog(
        Blog.findById(blog._id)
      );

    res.json({
      message:
        "Blog updated successfully.",
      blog: populated,
    });
  } catch (error) {
    console.error(
      "Update blog error:",
      error
    );

    res.status(500).json({
      message:
        "Could not update blog.",
      error: error.message,
    });
  }
};

// ==========================================
// PUBLISH / UNPUBLISH
// ==========================================

const toggleBlogPublish = async (
  req,
  res
) => {
  try {
    const blog =
      await Blog.findById(
        req.params.id
      );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found.",
      });
    }

    blog.isPublished =
      !blog.isPublished;

    blog.publishedAt =
      blog.isPublished
        ? new Date()
        : null;

    await blog.save();

    res.json({
      message: blog.isPublished
        ? "Blog published successfully."
        : "Blog unpublished successfully.",

      blog,
    });
  } catch (error) {
    console.error(
      "Blog status error:",
      error
    );

    res.status(500).json({
      message:
        "Could not change blog status.",
    });
  }
};

// ==========================================
// DELETE BLOG
// ==========================================

const deleteBlog = async (
  req,
  res
) => {
  try {
    const blog =
      await Blog.findById(
        req.params.id
      );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found.",
      });
    }

    await blog.deleteOne();

    res.json({
      message:
        "Blog deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete blog error:",
      error
    );

    res.status(500).json({
      message:
        "Could not delete blog.",
    });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogByIdAdmin,
  updateBlog,
  toggleBlogPublish,
  deleteBlog,
};