# Deployment readiness — 15 October 2026

Status: application checks passed with the limitations below; hosting configuration and staging verification remain required. No deployment, push, existing business-data changes, real admin login, AI generation, SMTP delivery or affiliate click was performed. Existing uncommitted SEO work was preserved.

## What changed in this pass

### Frontend

- `src/lib/api-url.mjs`, `src/lib/api.js`, `next.config.mjs`: production now requires a public HTTPS `NEXT_PUBLIC_API_URL` ending in `/api`. Missing URLs, localhost/private addresses, credentials, query strings and fragments fail validation. Development still defaults to `http://localhost:5000/api`.
- `src/lib/public-api.js`, homepage, review/comparison/blog listings, sitemap: fetch failures and invalid list responses throw rather than return successful empty content. Requests have a 10-second timeout. An unavailable API now results in HTTP 500 for these public pages/sitemap, not a reduced successful sitemap or invented empty catalogue. Retry occurs on a later request; there is no durable last-known-good cache.
- Primary and related fetches in deal/review/comparison/blog details, Deals listing and global search have bounded waits. Missing records still use the existing 404 handling. Search keeps its existing explicit unavailable state.
- `components/AdminGuard.jsx`: temporary backend failures show a retry state without deleting the stored session; genuine 401/403 responses still clear it. Access remains blocked until validation succeeds.
- New `.env.example`, API URL tests, read-only flow checks and test-only local API preload. Previous canonical/site-origin, noindex, breadcrumb and category changes remain intact.

### Backend

- `config/environment.js`: validates frontend origin, MongoDB URI presence/scheme, JWT secret, ports and known proxy-hop count. Production requires an HTTPS frontend, >=32-character random JWT secret and SMTP configuration.
- `config/db.js`, `server.js`: wait for MongoDB before listening; bound initial server selection to 10 seconds; production disables automatic index creation. `/api/health` is readiness and returns 503 while disconnected, 200 while connected. Startup errors are sanitized. SIGTERM/SIGINT stop HTTP service and disconnect MongoDB.
- CORS allows the configured frontend origin; localhost is automatically included only outside production. No wildcard or credentialed cookie CORS was added. Unknown origins receive no allow-origin header; this is browser policy, not authentication.
- Invalid JSON returns 400, oversized bodies 413; unexpected errors stay generic. Express identification header is disabled.
- Login has an in-memory baseline of 10 POST attempts/IP/15 minutes; public submissions 20/IP/hour. Existing reset limits remain. These per-process limits reset on restart and are not a shared distributed abuse-control system.
- `middleware/adminAuth.js`, `controllers/adminController.js`: only active accounts with recognized administrative roles are accepted. Authorization uses the current database role, not stale JWT role claims; missing roles cannot implicitly become superadmin. Login input types are validated.
- `utils/emailService.js`: production cannot fall back to printing or returning password-reset/invitation links when SMTP is absent. Non-465 production SMTP requires STARTTLS; 465 uses implicit TLS. Development fallback remains available locally.
- Three editorial AI controllers: missing optional Gemini configuration no longer prevents API startup; authenticated generation returns 503 instead. No generation was called against an external service.
- `scripts/createAdmin.js`: new bootstrap account is explicitly superadmin, existing accounts remain unchanged, and failures return a failing exit code. The script was NOT run.
- New disposable-memory HTTP/configuration tests; an older product-auth test was updated to supply a stored-account fixture instead of relying on role-only JWTs without a database.

## Required hosting settings

Configure two services, using their respective repository subdirectories as roots. Use Node 24 (the tested local runtime was 24.19.0); installed Mongoose requires at least Node 20.19.0. Do not expose backend secrets as `NEXT_PUBLIC_*`.

| Service | Variable | Placeholder / purpose |
| --- | --- | --- |
| Frontend | `NODE_ENV` | `production` (normally set by Next build/start) |
| Frontend | `SITE_URL` | `https://www.<your-domain>` — same at build and runtime |
| Frontend | `NEXT_PUBLIC_API_URL` | `https://api.<your-domain>/api` — set before build; it is public and baked into browser bundles |
| Frontend | `PORT` | Hosting-provided port, if required |
| Backend | `NODE_ENV` | `production` |
| Backend | `PORT` | Hosting-provided port; defaults to 5000 |
| Backend | `FRONTEND_URL` | `https://www.<your-domain>` — exact origin, no path; used by CORS and recovery/invitation links |
| Backend | `MONGODB_URI` | `mongodb+srv://<db-user>:<encoded-password>@<cluster>/<database>?retryWrites=true&w=majority` |
| Backend | `JWT_SECRET` | `<cryptographically-random-secret-at-least-32-characters>` |
| Backend | `TRUST_PROXY` | `<known-proxy-hop-count>`, default `0`; use `1` only if every request passes through exactly one trusted ingress |
| Backend | `SMTP_HOST` | `<smtp-host>` |
| Backend | `SMTP_PORT` | `<587-for-STARTTLS-or-465-for-implicit-TLS>` |
| Backend | `SMTP_USER` | `<smtp-user>` |
| Backend | `SMTP_PASS` | `<smtp-password>` |
| Backend | `SMTP_FROM` | `<verified-sender-name-and-email>` |
| Backend optional | `GEMINI_API_KEY` | `<backend-only-provider-key>`; omit to disable generation |
| One-time bootstrap only | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `<initial-superadmin-email>`, `<strong-initial-password>`; remove after bootstrap |

Do not use `.example` verification hosts or `NODE_OPTIONS=--require ./scripts/local-api-fixture.cjs` in hosting. `SEO_TEST_*` and `SEO_FIXTURE_UNAVAILABLE` are test controls, not deployment settings. `NEXT_PUBLIC_SITE_URL` is no longer needed. No OpenAI key is currently used by the inspected runtime controllers despite the installed SDK.

Generate a secret locally with a cryptographic generator and store it directly in the host's secret manager; never commit it. Rotating JWT_SECRET invalidates existing sessions. Percent-encode special characters in database credentials. Restrict the database user to the intended database and configure the cluster's network access/TLS for the host's actual egress. Do not broadly expose MongoDB just to make a connectivity check pass.

### Commands

Frontend service root: `saaspic-frontend`

```text
Install: npm ci
Build:   npm run build -- --webpack
Start:   npm start
```

Backend service root: `saaspic-backend`

```text
Install: npm ci --omit=dev
Build:   not required (plain Node.js JavaScript)
Start:   npm start
Health:  GET /api/health (requires a connected database)
```

Existing lockfiles are tracked. No dependencies or lockfiles were replaced during this check. `npm ci` is the hosting installation recipe, not a claim that a clean install was rerun locally. Development remains `npm run dev` in each directory; local `.env` files were not edited.

Create required production database indexes in a controlled migration before serving writes, since automatic index creation is now disabled in production. Inspect at least the unique Admin email, Product slug, Review slug, Comparison slug and Blog slug indexes. Do not use destructive `syncIndexes()` casually on business data. Bootstrap a new deployment's first account with `node scripts/createAdmin.js` only after confirming the target database; it will not elevate or replace an existing account.

Configure HTTPS, canonical-host redirects, TLS termination, process restart policy and the correct ingress/proxy count. Ensure only trusted infrastructure can supply forwarding headers if proxy trust is enabled. For multiple replicas, use shared gateway/Redis rate limits for login, recovery and submissions.

## Authentication, cookies and secrets

Authentication currently uses JSON JWT responses, browser localStorage and `Authorization: Bearer` headers. No application auth cookies, `Set-Cookie`, cookie sessions or credentialed fetch flow were found. Secure/HttpOnly/SameSite cookie settings therefore do not apply to the current implementation. This does not eliminate localStorage's exposure to XSS. A move to HttpOnly cookies would require a coordinated auth/CSRF/CORS change and was not attempted here.

Admin frontend guards are usability controls; backend middleware enforces authentication. Existing content-editing routes intentionally allow editor accounts; team role/deletion and affiliate administration have narrower role checks. Do not interpret noindex or CORS as private access protection.

Current Git checks found no tracked `.env` files; root/frontend ignore rules cover environment variants and permit only `.env.example`. Inspected frontend source did not reference database, JWT, SMTP-password or Gemini secret variables. This was not a full secret audit of Git history or an exhaustive dependency vulnerability audit. Existing public product projections omit private affiliate settings. No secret values were printed.

## Verification scope

Read-only local checks cover actual catalogue card contents for browse/search/category/sort, global search, product API, deal/review/category HTML, submission/login form responses and previous SEO regressions. There is no standalone public product-detail page; `/products/<slug>` correctly returns 404, while `/api/products/<slug>` exists.

Submission creation, admin login, listing/moderation, stale/inactive sessions, missing credentials, role escalation, CORS and malformed request cases use the real Express routes/controllers/middleware with disposable in-memory Mongoose document fixtures. No Mongo server is installed locally for an isolated database. These tests therefore do not establish durable MongoDB writes, browser interaction or a real account's session behavior. Existing live-data mutation/invitation test scripts were intentionally not run.

Production frontend verification uses a reserved public-shaped API URL mapped to the existing localhost API by a test-only Node preload. This validates server HTML and public config shape without contacting a new API host. A separate fixture returns 503 for API calls to test outage behavior. Browser-to-host DNS/TLS/network access is NOT tested by this mapping.

## Manual checks and remaining launch blockers

1. Supply real hosting origins, database credentials/network permissions, strong JWT secret and working SMTP with a verified sender. Verify a fresh backend production boot connects successfully and `/api/health` becomes 200. Only failure-to-connect behavior was tested with a new production process locally.
2. Check indexes and backups/recovery on a staging database. Confirm there is an appropriately provisioned superadmin; no real account was changed or used to log in.
3. In a browser against staging, use a disposable account and clearly marked disposable submission to verify form validation, login/localStorage, role-specific UI, moderation and logout. Delete only that test data afterward. Verify persistence through a backend restart. No real submission or business record was created here.
4. Send password reset/invitation emails only to an authorized test mailbox. Verify provider TLS, sender domain, delivery and single-use/expiry behavior. This requires an external SMTP service and was not performed.
5. Confirm frontend/backend HTTPS and CORS in an actual browser, including preflight, alternate hosts and no mixed content. Do not use development tooling for public hosting.
6. Confirm vendor offers and ratings before treating the content as verified. See `OFFER-CORRECTION-REVIEW.md`; these commercial facts remain untouched. AI functionality, if desired, needs an authorized provider key and an explicit test; it is optional for core operation.
7. Recheck sitemap, robots and indexability on the deployed origin using Search Console; run Rich Results Test and mobile/performance checks separately. No rankings or Core Web Vitals results are inferred from these local checks.

References: [Next environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Mongoose connections](https://mongoosejs.com/docs/connections.html), [Express CORS](https://expressjs.com/en/resources/middleware/cors/), [Express security](https://expressjs.com/en/advanced/best-practice-security/).

## Recorded results

| Check | Result |
| --- | --- |
| Final frontend webpack production build and `npm start` | Passed; final smoke responses: home/admin/sitemap 200, production diagnostic route 404 |
| Backend isolated HTTP/config/date/product/deal tests | 21 passed, 0 failed; all writes were disposable model fixtures |
| Frontend site/API URL unit tests | 5 passed, 0 failed |
| Deal browse/search/sort/filter and global search | Passed in development and mapped local production; compared actual card contents/order with public API records |
| SEO regressions | 132 route checks passed in development and local production; all 22 sitemap destinations returned 200 |
| Rendered content/link/schema checks | 19 page variants and 44 internal links passed in development and mapped local production |
| Unavailable-service fixture | Public content/sitemap returned 500 rather than empty 200 or misleading 404; search showed its explicit unavailable state |
| New production boot with unreachable local Mongo | Refused to listen, exited 1 after bounded selection timeout, logged a sanitized startup failure; no external database contacted |
| Production CORS | Configured HTTPS origin allowed; localhost/untrusted origin received no allow-origin header; no cookie credentials |
| Syntax/lint/whitespace | Bootstrap syntax passed; changed frontend JavaScript had zero lint errors with warnings; updated AdminGuard lint had zero errors/warnings; git diff --check passed |
| Real hosted database, SMTP, real browser login/persistent moderation | Not tested; requires the staging resources and manual steps above |

An initial legacy product-auth test failed because it tried to use a role-only token without a stored-account fixture; it now tests the actual database-role authentication contract with a disposable fixture and passes. One review response transiently returned 500 during dev-server changes; direct recheck and subsequent complete dev/production suites passed. The outside-repository lockfile warning and image optimization warnings remain non-blocking.

## Changed-file inventory for this pass

Backend: `server.js`, `config/db.js`, new `config/environment.js`, `controllers/adminController.js`, `controllers/aiReviewController.js`, `controllers/aiBlogController.js`, `controllers/aiComparisonController.js`, `middleware/adminAuth.js`, new `middleware/loginRateLimit.js`, `utils/emailService.js`, `scripts/createAdmin.js`, `scripts/aiProduct.test.js`, new `scripts/deployment.test.js`, and new `.env.example`.

Frontend: `next.config.mjs`, `src/lib/api.js`, new `src/lib/api-url.mjs`, new `src/lib/public-api.js`, `src/components/AdminGuard.jsx`, `src/app/page.js`, `src/app/reviews/page.js`, `src/app/blogs/page.js`, `src/app/comparisons/page.js`, `src/app/sitemap.js`, `src/app/deals/page.js`, four existing detail-page files under deals/reviews/blogs/comparisons, `src/app/search/page.js`, new `.env.example`, `scripts/apiUrl.test.mjs`, `scripts/check-deployment-flows.mjs`, and `scripts/local-api-fixture.cjs`.

Documentation: this report and an update to `SEO-FIRST-BATCH.md` so its local production instructions agree with the stricter API configuration. All other prior SEO modifications remain uncommitted and preserved.
