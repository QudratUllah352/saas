const express = require("express");

const {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogByIdAdmin,
  updateBlog,
  toggleBlogPublish,
  deleteBlog,
} = require("../controllers/blogController");

const adminAuth =
  require("../middleware/adminAuth");

const router = express.Router();

// PUBLIC
router.get("/", getBlogs);

// ADMIN
router.get(
  "/admin/all",
  adminAuth,
  getAllBlogsAdmin
);

router.get(
  "/admin/:id",
  adminAuth,
  getBlogByIdAdmin
);

router.post(
  "/",
  adminAuth,
  createBlog
);

router.patch(
  "/:id",
  adminAuth,
  updateBlog
);

router.patch(
  "/:id/status",
  adminAuth,
  toggleBlogPublish
);

router.delete(
  "/:id",
  adminAuth,
  deleteBlog
);

// PUBLIC - KEEP LAST
router.get(
  "/:slug",
  getBlogBySlug
);

module.exports = router;