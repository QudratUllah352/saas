require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { frontendOrigin, validateEnvironment } = require("./config/environment");

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

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));

// ============================================
// CORS
// ============================================

const allowedOrigins = [
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"]),
  frontendOrigin(),
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
app.use("/api/admin/login", require("./middleware/loginRateLimit").createLoginRateLimit());
app.post("/api/deal-submissions", require("./middleware/loginRateLimit").createLoginRateLimit({
  limit: 20, windowMs: 60 * 60 * 1000, message: "Too many submissions. Please retry later.",
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    message: ready ? "SaaSpin API is ready" : "Database unavailable",
  });
});
// Initialize once per Vercel instance; share the promise across requests.
let databaseReady;

app.use(async (req, res, next) => {
  if (!process.env.VERCEL) return next();

  try {
    if (!databaseReady) {
      databaseReady = Promise.resolve().then(() => {
        validateEnvironment();
        return connectDB();
      });
    }

    await databaseReady;
    next();
  } catch (error) {
    databaseReady = undefined;
    console.error("Database initialization failed:", {
      name: error.name,
      code: error.code,
      message: error.message?.replace(
        /mongodb(?:\+srv)?:\/\/[^\s]+/gi,
        "[REDACTED DATABASE URI]"
      ),
    });

    res.status(503).json({
      message: "Service temporarily unavailable",
    });
  }
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
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  if (error.type === "entity.too.large") return res.status(413).json({ message: "Request body too large" });
  console.error("Unhandled server error:", error.name || "Error");

  res.status(500).json({
    message: "Internal server error",
  });
});

// ============================================
// START SERVER
// ============================================

async function start() {
  const { port } = validateEnvironment();
  await connectDB();
  const server = app.listen(port, () => console.log(`API listening on port ${port}`));
  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timeout); });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
}

if (require.main === module && !process.env.VERCEL) {
  start().catch(() => {
    console.error(
      "API startup failed. Check backend environment configuration and MongoDB connectivity."
    );
    process.exitCode = 1;
  });
}

module.exports = app;

// Preserve compatibility with scripts importing { app, start }.
module.exports.app = app;
module.exports.start = start;
