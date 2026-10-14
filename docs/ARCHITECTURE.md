# SaaSpin Architecture

## System Overview

SaaSpin uses a separated frontend/backend architecture.

User Browser
↓
Next.js Frontend
↓
Express REST API
↓
MongoDB Atlas

External services such as Gemini are accessed by the backend only.

---

## Frontend

Directory:

saaspic-frontend/

Technology:

- Next.js
- React
- JavaScript
- App Router
- CSS

Development URL:

http://localhost:3000

API environment variable:

NEXT_PUBLIC_API_URL

---

## Backend

Directory:

saaspic-backend/

Technology:

- Node.js
- Express.js
- Mongoose
- JWT
- bcrypt
- Gemini API

Development URL:

http://localhost:5000

API prefix:

/api

---

## Main Public Flow

Visitor
↓
Navbar / Homepage
↓
Deals / Reviews / Comparisons / Blogs
↓
Details page
↓
Product CTA
↓
Affiliate tracking endpoint when enabled
↓
External SaaS website

---

## Deal Category Routing

Use one Deals page.

Correct:

/deals?category=ai
/deals?category=marketing
/deals?category=crm

Do not create separate category pages such as:

/deals/ai

/deals/[slug] is reserved for individual deal/detail behavior.

---

## Admin Architecture

Admin interface:

/admin

Admin communicates with protected backend API routes.

Protected API requests use admin authentication.

Admin must not be exposed through public navigation.

---

## AI Architecture

Gemini is called from the backend.

Never call Gemini directly from the browser with the secret API key.

AI-generated content is a draft.

Flow:

Admin
↓
AI Writer
↓
Backend
↓
Gemini
↓
Structured draft
↓
Admin reviews/edits
↓
Publish

Never automatically publish AI-generated content.

---

## Affiliate Architecture

Visitor clicks CTA
↓
/api/affiliate/go/:productId?source=...
↓
Backend validates product
↓
Click recorded
↓
Backend reads private affiliate URL
↓
Redirect

Raw affiliate URLs must remain private backend data.