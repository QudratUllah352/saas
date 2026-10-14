# SaaSpin API Documentation

Base development URL:

http://localhost:5000/api

---

## Public API

### Categories

Category endpoints are responsible for retrieving SaaS categories.

Controller:

categoryController.js

Routes:

categoryRoutes.js

---

### Products

Product endpoints provide SaaS product information.

Controller:

productController.js

Routes:

productRoutes.js

Public Product responses must not expose private affiliate data.

---

### Deals

Controller:

dealController.js

Routes:

dealRoutes.js

Used for:

- Deal listings
- Deal details
- Category-related deal discovery
- Admin deal management where applicable

---

### Deal Submissions

Controller:

dealSubmissionController.js

Routes:

dealSubmissionRoutes.js

Used for public deal submissions and admin moderation.

---

### Reviews

Controller:

reviewController.js

Routes:

reviewRoutes.js

Public routes return published reviews.

Admin routes manage review content.

---

### Comparisons

Controller:

comparisonController.js

Routes:

comparisonRoutes.js

Public routes return published comparisons.

---

### Blogs

Controller:

blogController.js

Routes:

blogRoutes.js

Public routes return published blog content.

---

### Global Search

Endpoint family:

/search

Controller:

searchController.js

Routes:

searchRoutes.js

Searches across SaaSpin content.

Public search results must use public-safe Product data.

---

## Affiliate API

Base:

/affiliate

### Redirect

GET /affiliate/go/:productId

Optional query:

source

Example:

/affiliate/go/PRODUCT_ID?source=deal

Purpose:

1. Validate affiliate configuration
2. Record affiliate click
3. Redirect visitor

---

### Admin Affiliate Products

GET /affiliate/admin/products

Authentication:

Admin required

---

### Update Affiliate Settings

PATCH /affiliate/admin/products/:productId

Authentication:

Admin required

---

### Affiliate Statistics

GET /affiliate/stats

Authentication:

Admin required

---

## AI APIs

AI routes exist for:

- Reviews
- Comparisons
- Blogs

AI endpoints are intended for admin-assisted content creation.

Gemini credentials remain backend-only.

Generated content is a draft and must not automatically publish.

---

## Admin Authentication

Admin routes use protected authentication.

Admin requests requiring authentication use the existing JWT
system.

Do not create unprotected duplicate admin endpoints.

---

## Important API Rule

Before adding a new endpoint:

1. Inspect the corresponding route file.
2. Inspect the controller.
3. Check whether an endpoint already exists.
4. Check authentication requirements.
5. Check whether the response is public or private.
6. Ensure private Product affiliate information cannot leak.