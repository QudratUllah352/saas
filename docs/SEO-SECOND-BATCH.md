# Second SEO batch: review, implementation and editorial queue

15 October 2026. All first-batch uncommitted changes were present at the start and preserved. No database writes, AI generation endpoint calls, publication changes, deployments or pushes.

## First-batch review

The previous webpack production build passed, as did 132 route checks in both development and local production, site-origin tests and changed-file lint (with existing image warnings). Before this batch, the three URL tests and 132 development route checks passed again. No blocking first-batch defect was identified.

Still unresolved: real production environment/HTTPS/host configuration, independent verification of all four offers, API URL's development fallback, sitemap API-outage resilience, raw-image optimization, field performance, publisher transparency and editorial evidence. The removal of root loading remains intentional: validation must precede the response stream for actual HTTP 404/308 statuses.

## Inspection findings and technical changes

| Area | Evidence | Action / remaining limitation |
| --- | --- | --- |
| Homepage metadata | `app/page.js`: root page did not receive the parent's title suffix | Set an explicit branded root title; preserve its existing unique description and canonical |
| Category metadata | Six category filters shared the Deals title, description, broad canonical and generic H1 | Dynamic category titles/descriptions/H1; normalize aliases to a canonical category query URL; mark these thin filters `noindex, follow`. No new category paths or fabricated guides |
| Search variants | `/deals?search=...` inherited indexable listing metadata; repeated search/sort parameters could cause invalid operations | Search-specific metadata and `noindex, follow`; repeated parameter values rejected. Sort URLs canonicalize to the corresponding clean category/base listing |
| Deal metadata | Description reused product summary rather than distinguishing offer intent | Product-specific deal description referencing existing pricing/schedule UI without inserting unverified prices or promotions; clear product + Deal H1 |
| Review metadata | Four published reviews have distinct titles/excerpts | Kept existing editorial metadata. These checks do not establish the factual quality of excerpts |
| Canonicals | First-batch site-origin handling is consistent; no separate public product route exists | Preserve ID-based deal and editorial-slug URLs; category canonicals now represent their filtered content rather than the broader page |
| Unsupported homepage claims | `Hero.jsx`: 4.9 TrustScore, 10,000+ audience, avatars, verified/vetted wording and perpetual-free claim; `app/page.js`: invented fallback inventory counts | Removed unsupported social proof and verification/expertise promises. Display actual inventory counts. Other existing editorial claims still need human review |
| Heading hierarchy | Review cards used a product H3 before a review H2 under existing H2 sections | Product name becomes styled text; review title becomes H3. Existing appearance selectors adjusted without redesign |
| Missing ratings | Review cards coerced missing ratings to 0 | Show only existing finite numeric ratings from 0–5 and label them editorial. Existing database ratings remain unchanged; their evidence still needs review |
| Internal links | Detail pages lacked a visible full breadcrumb trail; alternative cards had no discovery link | Add Home → Deals/Reviews → current page; link categories, published deal details and alternative-product searches. Use Next Link for homepage page navigation; retain in-page anchors |
| Duplicate deal copy | Offer panel repeated the product summary | Remove that repeated paragraph. Longer product/about and review text still needs editorial differentiation |
| Images | Inspected templates already have alt attributes; current four products have no logos | Improve alternative-logo fallback alt text. No imagery or descriptive claims were invented. Placeholder-only output cannot demonstrate future uploaded assets' quality |
| Structured data | No pre-existing JSON-LD found on the requested templates | Add minimal Organization on home and BreadcrumbList on deal/review details, matching visible names/navigation and validated site origin. JSON is escaped for script context. No Product/Offer/Review/AggregateRating was added |

Organization is limited to name and URL; no unverified address, contact, logo or rating is inserted. Breadcrumb schema describes the navigation shown to users. Technical JSON/field checks are not a Google eligibility certification, and valid markup does not guarantee rich results. See [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), and [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization).

## Proposed review draft

See [APIFY-REVIEW-PROPOSED-DRAFT.md](APIFY-REVIEW-PROPOSED-DRAFT.md). It uses current official sources, explicitly separates documented facts from editorial inference, proposes no score, and marks testing/offer/author details requiring verification. It is a file for review, not a published article or database update.

## Five article ideas grounded in the actual category taxonomy

| Idea | Actual categories | Search intent and evidence needed |
| --- | --- | --- |
| How to evaluate an AI tool directory before paying for a listing | AI Tools; SEO & Marketing | Help tool owners distinguish directory browsing from paid advertising; use AI Top Tools only after verifying current packages |
| Apify Actors versus a custom script: an evaluation checklist | Development | Help developers choose an implementation; add a reproducible task, maintenance considerations and measured costs before declaring a winner |
| How to review an advertising tool's reporting and budget controls | SEO & Marketing; AI Tools | A buying checklist; use Advertmate as an example only for features verified in documentation or testing |
| Choosing a video/design tool for a repeatable content workflow | Video & Design; Productivity | Educational guide covering input/output formats, collaboration and export requirements; do not invent product recommendations for currently empty categories |
| Choosing a CRM: pipeline, permissions and data-export questions | Sales & CRM; Productivity | Practical evaluation questions for small teams; research actual products before recommending alternatives |

Use one main intent per page. Expand existing reviews rather than creating near-duplicate reviews/overviews for the same product. Do not publish unsupported comparisons simply because products share a category.

## Prioritized editorial queue

1. **AI Top Tools deal and `/reviews/ai-top-tools-review`**: establish the actual package and currency; resolve 222/478/20% inconsistency; distinguish directory functionality from software being listed; document any rating basis. See the first-batch offer review for record IDs.
2. **Advertmate deal and `/reviews/advertmate-review`**: verify official coupon/package/billing terms and the reference price; add concrete product evidence and revise generic/vendor-style copy.
3. **Comp AI deal and `/reviews/comp-ai-review`**: verify any private annual promotion against scoped official pricing; qualify compliance claims and document the rating method.
4. **Apify deal and `/reviews/apify-review`**: use the proposed draft as a starting point; verify the promotion and add original testing evidence before a scored assessment.
5. **Three comparisons** (`/comparisons/ai-top-tools-vs-comp-ai`, `/comparisons/advertmate-vs-ai-top-tools`, `/comparisons/advertmate-vs-comp-ai`): confirm a useful shared buying decision, or propose a different editorial treatment. No publication flags were changed.
6. **Category filters**: AI Tools and Development have products but little category guidance; SEO & Marketing, Video & Design, Sales & CRM and Productivity currently have no product inventory. Research guides before making category pages indexable. Do not pad empty pages.
7. **Homepage and related guides**: review remaining expertise/curation wording, substantiate publisher identity, and distinguish vendor-derived summaries from original analysis. Add About/Contact/privacy/editorial information with real details.

Google's [review guidance](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews) favors original analysis and evidence; word count alone is not a quality target.

## Checks

From `saaspic-frontend`, with the backend and frontend running:

```powershell
node --test scripts/siteUrl.test.mjs
node scripts/check-seo-routes.mjs
node scripts/check-seo-content.mjs
```

Use the first-batch production test environment instructions for local production checks. The new content script covers all four deals/reviews, all six categories, home/listings and search/alias variants; it checks titles/descriptions, canonicals, indexing policy, H1 count, rendered image alt attributes and Organization/Breadcrumb JSON-LD consistency. It never follows affiliate links or changes records.

Remaining external checks: deployed Rich Results Test, Search Console canonical/indexing inspection, mobile visual/accessibility review and production performance measurement. Real production configuration remains mandatory; the reserved test origin is not a live domain.

## Verification results

- Final webpack production build passed using the documented reserved site origin and local API test settings. Public data pages remain dynamic. Existing dynamic-rendering bailout logs and the ignored outside-repository lockfile warning remain non-blocking.
- Three URL unit tests passed.
- First-batch route regression: 132 checks passed in development and production; all 22 sitemap destinations returned 200.
- New content regression: 19 page variants passed in development and production, covering all six categories and all current deals/reviews. Forty-four internal link destinations returned successful or redirect responses in each mode.
- Indexable pages in scope had nonempty, unique titles/descriptions, normalized expected canonicals and one H1. Category filters had distinct titles and noindex. Current rendered images had nonempty alt attributes; four missing product logos render placeholders rather than image elements, so this is not a complete uploaded-image audit.
- Organization/Breadcrumb JSON-LD parsed successfully, used the expected site origin and matched visible breadcrumb names. No price/rating/review schema was emitted. Google Rich Results Test was not run against a public deployment.
- Changed/new JavaScript lint: nine modules, zero errors, eight existing image warnings. The initial lint run exposed existing raw homepage navigation anchors; these were converted to Link and lint then passed.
- `git diff --check` passed. No database updates or publication actions were performed.

## Files changed in this batch

- `saaspic-frontend/src/app/page.js`: branded title, factual homepage Organization, inventory counts and Next page links.
- `saaspic-frontend/src/app/deals/page.js`: category/search metadata, canonical/noindex policy, validated parameters, category-aware H1 and search accessible name.
- `saaspic-frontend/src/app/deals/[slug]/page.js`: deal-specific description/H1, breadcrumb/category link and removal of repeated summary.
- `saaspic-frontend/src/app/reviews/[slug]/page.js`: breadcrumbs, category/offer/alternative discovery links, alternative logo alt fallback.
- `saaspic-frontend/src/components/Hero.jsx`: remove unsupported social proof, verification/expertise claims and permanent-free promise.
- `saaspic-frontend/src/components/ReviewCard.jsx` and `src/app/globals.css`: heading hierarchy and corresponding appearance selectors; avoid synthesizing missing ratings.
- New `Breadcrumbs.jsx`, `Breadcrumbs.module.css`, `JsonLd.jsx`: visible navigation and matching escaped server-rendered schema.
- New `scripts/check-seo-content.mjs`: read-only rendered SEO/schema/link checks.
- New `docs/APIFY-REVIEW-PROPOSED-DRAFT.md` and this report: unpublished source-backed draft, article ideas, findings and editorial priorities.

Other first-batch modifications remain in the working tree and were not reset, committed or pushed.
