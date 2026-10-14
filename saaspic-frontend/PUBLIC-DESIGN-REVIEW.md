# Public design consistency

The existing homepage remains the design reference. Public page styling reuses its Geist typography, Deep Teal (#0E7490), Soft Teal (#67C6D8), Ice Blue (#F5FBFC), white cards, slate text, subtle borders, rounded surfaces, and restrained shadows.

## Completed

- Deals listing/filter and details: consistent hero, category buttons, toolbar, cards, offers, FAQ, and mobile stacking.
- Reviews listing and details: consistent headers, editorial typography, verdict/rating/pricing panels, and responsive grids.
- Comparisons listing and details: matching cards, product/verdict panels, public back button, and locally scrolling comparison tables.
- Blogs listing and details: matching hero, article/sidebar surfaces, related cards, and mobile article layout.
- Search: matching form and results, responsive result cards, and corrected JSX text escaping.
- Submit Deal: consistent form surface, readable input sizes, touch targets, and mobile columns.
- Affiliate disclosure: matching content panels and the existing shared Navbar/Footer.
- Shared mobile navigation: fixed hamburger bars shrinking to zero height. Shared Navbar, Footer, and homepage cards otherwise retain their existing homepage design.

## Modified files

- `src/app/public-pages.css` (new scoped public stylesheet).
- `src/app/globals.css` (only the mobile hamburger bar sizing fix).
- `src/app/deals/page.js`, `src/app/deals/[slug]/page.js`.
- `src/app/reviews/page.js`, `src/app/reviews/[slug]/page.js`.
- `src/app/comparisons/page.js`, `src/app/comparisons/[slug]/page.js`.
- `src/app/blogs/page.js`, `src/app/blogs/[slug]/page.js`.
- `src/app/search/page.js`, `src/app/submit-deal/page.js`, `src/app/affiliate-disclosure/page.js`.
- `scripts/check-public-design.cjs` (read-only browser checks).

No admin, backend, authentication, API, MongoDB, homepage page source, SEO metadata, URLs, or data relationships were changed. Public styling is scoped to `.public-page`; existing global design tokens and admin CSS were preserved. Login and the diagnostic API test route were left unchanged. Existing loading/error/not-found screens already use the site's shared state styles and were preserved.

## Verification

- `npm run build`: passed.
- ESLint on changed public pages and the browser-check script: no errors; existing `<img>` optimization warnings remain.
- Chrome checks against the local frontend and real API: seven public pages at 320, 375, 430, 768, 1024, and 1440 pixels (42 checks), with no page horizontal overflow.
- Mobile navigation opening/closing and visible hamburger bars checked at the three widths below 768 pixels.
- Screenshots at 375 and 1440 pixels, plus measurements, are in `design-review/`.

The real API currently returns no deals, reviews, comparisons, or blogs. Their populated detail pages and result cards therefore could not be visually tested with real content. No mock content was added. Detail code builds successfully, and styles include responsive grid, long-text, image, and table handling. The browser script automatically checks the first real detail record per section when available.

Existing build warnings concerning `metadataBase`, the external lockfile, and static prerender attempts for dynamic API pages remain; metadata and configuration were outside this design change.
