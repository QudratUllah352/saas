# SEO first batch: configuration and verification

Implemented 15 October 2026. No deployment, push, database writes, or offer edits.

Deployment follow-up: production API validation and backend startup/email checks have since been tightened. See `DEPLOYMENT-READINESS.md` for current hosting configuration and verification limits.

## Production configuration

Set these in the hosting providers' environment settings, not committed source files:

| Application | Variable | Example only | When required |
| --- | --- | --- | --- |
| Next.js frontend | `SITE_URL` | `https://www.your-domain.com` | Production build and production server; use the same value for both |
| Next.js frontend | `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com/api` | Before building; public browser bundle value is fixed at build time |
| Express backend | `FRONTEND_URL` | `https://www.your-domain.com` | Backend startup; permits browser requests through existing CORS configuration |

`SITE_URL` is the one site origin for canonicals, metadataBase, Open Graph URLs, robots sitemap discovery, XML sitemap entries, and article sharing. `NEXT_PUBLIC_SITE_URL` is no longer used by these features and can be removed from hosting settings. Share components receive the validated origin from their server page.

Production `SITE_URL` must be present, HTTPS, and use a public hostname. Credentials, paths other than `/`, query strings, fragments, and local/private hosts are rejected. A trailing slash is accepted and normalized. Missing/invalid configuration stops the production build/start; errors do not echo the configured value. This validates URL syntax and common local addresses, not DNS ownership, public reachability, certificates, or host redirects.

Development defaults to `http://localhost:3000` when `SITE_URL` is absent. Existing local settings were not read or edited. For another development port set `SITE_URL` explicitly.

The API must be reachable from both the Next server and visitor browsers. Include `/api`, use HTTPS in production, and never use localhost for the deployed public API. The deployment follow-up now rejects missing/local production API settings; only development retains the localhost fallback. Keep existing backend database, authentication and AI secrets server-side and unchanged. Use the normal production process (`next start`, which sets production mode); do not override it to development.

Choose the canonical hostname first. Configure the hosting layer to redirect alternative HTTP/HTTPS hostnames to it, then build and restart the frontend with matching settings. Restart the backend after updating CORS. Rebuild whenever the public API URL changes; rebuild and restart when the canonical site URL changes because static metadata/robots may be produced during the build.

## Indexing and route behavior

- Login, password recovery/reset, invitations: `noindex, nofollow` from server layouts, including client-rendered forms.
- Internal search: `noindex, follow`; result links remain usable.
- Admin: existing inherited `noindex, nofollow` and authentication are preserved.
- `/api-test`: `noindex` in development; calls `notFound()` before fetching any diagnostic data in production.
- Missing deal/review/comparison/blog records: `notFound()`. Missing referenced product(s) also make the relevant deal/review/comparison unavailable.
- Backend failure statuses other than 404 throw errors rather than masquerading as a missing record.
- Known legacy category paths such as `/deals/ai` redirect permanently to `/deals?category=ai-tools`; unknown paths return 404.
- Invalid or repeated category query parameters return 404. Existing valid categories remain usable even when they have no offers. Category filters continue using the existing single Deals page.
- There is no public product-detail frontend route. Unknown `/products/...` URLs use the site 404; the existing backend product-by-slug API already returns 404.
- Root `loading.js` was removed because its Suspense fallback committed 200 before the record/category checks finished. Public navigation now waits for validation/rendering instead of showing that generic early spinner. Streaming metadata was not globally disabled. Future Suspense boundaries must sit after checks when an actual 404/308 is required.

Noindex and robots rules are not authorization. No authentication or backend permission checks were weakened, and no robots disallow was added that would prevent crawlers reading utility-page noindex tags.

References: [Next loading and status codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading), [Next notFound](https://nextjs.org/docs/app/api-reference/functions/not-found), [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Repeatable checks

Run from `saaspic-frontend`, with the existing backend running:

```powershell
node --test scripts/siteUrl.test.mjs
node scripts/check-seo-routes.mjs
```

For a local production verification, use a separate port and test-only environment overrides. The reserved `.example` origin is an assertion fixture, not a deployment configuration:

```powershell
$env:SITE_URL = 'https://saaspin.example'
$env:NEXT_PUBLIC_API_URL = 'https://api.saaspin.example/api'
$env:NODE_OPTIONS = '--require ./scripts/local-api-fixture.cjs'
npm.cmd run build -- --webpack
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
```

The preload is a test-only mapping from the reserved API hostname to the existing localhost backend. Never configure this `NODE_OPTIONS` preload on a deployment; it does not test real production DNS/TLS or browser API connectivity.

In a second terminal:

```powershell
$env:SEO_TEST_ORIGIN = 'http://127.0.0.1:3100'
$env:SEO_EXPECTED_SITE_ORIGIN = 'https://saaspin.example'
$env:SEO_TEST_PRODUCTION = 'true'
node scripts/check-seo-routes.mjs
```

The test script only reads pages and APIs; it does not follow affiliate links, make purchases, generate AI content, or modify database records. It checks utility/admin noindex, production diagnostic removal, missing resources/categories, legacy redirects, all sitemap destinations/canonicals, sharing URLs, and sampled API authentication. Missing-page cases run with browser, Googlebot and Twitterbot user agents. User-agent simulation checks response differences; it does not prove how Google indexes the deployment.

After deployment, rerun against the real origin/API and verify HTTPS, hostname redirects, Search Console URL inspection, robots and sitemap discovery. Production performance and real-user Core Web Vitals remain separate checks. Sitemap API-outage resilience and the audit's editorial/schema work remain outside this batch.

## Results from this implementation

- Initial Git status was clean; existing source and backend authentication were preserved.
- Three site-origin unit tests passed, including invalid URLs, secrets-safe error messages and production local-host rejection.
- Actual production startup refused both missing `SITE_URL` and a localhost `SITE_URL`.
- Development integration: 132 checks passed; all 22 sitemap destinations returned 200 with matching canonical origins.
- Production integration on port 3100: the same 132 checks passed; all 22 sitemap destinations returned 200; utility/admin noindex, production diagnostic 404, legacy 308 and missing-page 404/noindex were verified. Production metadata/sharing used the reserved test origin.
- Webpack production build passed. Its first sandboxed attempt failed to download existing Google Fonts; rerunning with network access succeeded. Existing broad fetch catches logged Next's dynamic-rendering bailout diagnostics during prerender attempts; the build's route table correctly identified public data pages as dynamic.
- ESLint on 23 changed/new JavaScript modules: zero errors, 11 existing raw-image warnings. `git diff --check` passed.
- Existing warning: a package lock outside this repository is ignored by Next.js. It was not modified.
- Offer review used GET requests only. No database records, prices, discounts, credentials, or private affiliate URLs were changed.
