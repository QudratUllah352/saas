require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const dealRoutes = require("./routes/dealRoutes");
const dealSubmissionRoutes = require(
  "./routes/dealSubmissionRoutes"
);
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const aiReviewRoutes = require("./routes/aiReviewRoutes");
const comparisonRoutes = require(
  "./routes/comparisonRoutes"
);
const aiComparisonRoutes = require(
  "./routes/aiComparisonRoutes"
);
const blogRoutes = require("./routes/blogRoutes");
const aiBlogRoutes = require("./routes/aiBlogRoutes");
const searchRoutes = require("./routes/searchRoutes");
const affiliateRoutes = require(
  "./routes/affiliateRoutes"
);

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================
// CORS
// ============================================

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "SaaSpin API is running",
  });
});

// ============================================
// API ROUTES
// ============================================

// Categories
app.use(
  "/api/categories",
  categoryRoutes
);

// Products
app.use(
  "/api/products",
  productRoutes
);

// Deals
app.use(
  "/api/deals",
  dealRoutes
);

// Public deal submissions + admin moderation
app.use(
  "/api/deal-submissions",
  dealSubmissionRoutes
);

// Admin authentication
app.use(
  "/api/admin",
  adminRoutes
);

// Reviews
app.use(
  "/api/reviews",
  reviewRoutes
);

// AI Review Writer
app.use(
  "/api/ai",
  aiReviewRoutes
);

// Comparisons
app.use(
  "/api/comparisons",
  comparisonRoutes
);

// AI Comparison Writer
app.use(
  "/api/ai/comparisons",
  aiComparisonRoutes
);

// Blogs
app.use(
  "/api/blogs",
  blogRoutes
);

// AI Blog Writer
app.use(
  "/api/ai/blogs",
  aiBlogRoutes
);

// Global Search
app.use(
  "/api/search",
  searchRoutes
);

// Affiliate tracking + admin affiliate management
app.use(
  "/api/affiliate",
  affiliateRoutes
);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});