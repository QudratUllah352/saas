# SaaSpin Security Rules

## Secrets

Never expose:

- MONGODB_URI
- JWT_SECRET
- GEMINI_API_KEY
- Admin passwords
- Affiliate credentials
- Private API keys

Secrets belong in environment files.

Never place secrets in frontend JavaScript.

Never commit .env files.

---

# Admin

Admin API endpoints must require authentication.

Do not assume that hiding /admin makes it secure.

Frontend checks are not sufficient security.

Backend authorization must protect privileged operations.

---

# Passwords

Admin passwords must be hashed.

Never store plain-text passwords.

---

# Affiliate Security

Private affiliate data must never be returned from public APIs.

Private:

affiliate.url
affiliate.programName
affiliate.network
affiliate.commissionType
affiliate.commissionValue

Public:

affiliate.enabled
affiliate.disclosureText

Affiliate redirects should happen through the backend.

---

# AI Security

Gemini API keys must remain backend-only.

Frontend:

DO NOT call Gemini directly.

Correct:

Frontend
→ SaaSpin Backend
→ Gemini

---

# Public API Data

Before adding a new public API endpoint, check whether populated Product documents expose private fields.

Use the project's public Product projection where appropriate.

---

# Admin SEO

Admin pages should use noindex/nofollow.

However:

SEO controls are not security controls.

Authentication and authorization are required.

---

# Development Rules

Before replacing a working file:

1. Read the existing file.
2. Understand dependencies.
3. Preserve existing functionality.
4. Change only what is necessary.
5. Test after modification.

Do not perform large rewrites without understanding the current implementation.