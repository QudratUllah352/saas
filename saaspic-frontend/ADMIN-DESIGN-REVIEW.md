# Admin UI update

The existing admin routes use a minimal teal design through an admin-only stylesheet imported by `src/app/admin/layout.js`. Public styles, the homepage, authentication logic, backend, API endpoints, and database records were not changed.

## Completed

- Simplified sidebar, section headings, topbar, white surfaces, borders, buttons, and forms. Mobile sidebar supports Escape and exposes its open state to assistive technology. Hidden mobile navigation is removed from keyboard focus through CSS visibility.
- Dashboard overview, product editors/category selection, deal editor, review/comparison/blog editors and AI writers, and affiliate settings/analytics receive the same lightweight form and panel styles without dropping fields or actions.
- Product, deal, review, comparison, blog, and submission lists use real-data tables. Tables become labeled stacked rows below 768px; editing, external viewing, deleting, status changes, and inline submission publication keep their existing handlers.
- Distinct text/color badges for Draft, Published, Pending, Approved, Rejected, Active, and Inactive.
- Added success feedback to product/deal/review/comparison actions; blog errors are distinguished from success messages. Added alert/status semantics to existing feedback and loading text, and connected simple form labels with their inputs.
- Added confirmation before rejecting a submission; existing record-deletion confirmations remain.
- Removed the redundant public Navbar from the existing nested admin submission route. Its existing comparison-fetching behavior remains unchanged.

No separate category-management route exists. Category selection remains in the existing product forms; no category CRUD features or routes were invented.

## Modified files

- `src/app/admin/admin-ui.css` (new).
- `src/app/admin/layout.js`.
- `src/components/AdminShell.jsx`.
- `src/components/AdminRecordTable.jsx` (new).
- `src/app/admin/products/page.js`, `products/new/page.js`, `products/[id]/edit/page.js`.
- `src/app/admin/deals/page.js`, `deals/[id]/edit/page.js`.
- `src/app/admin/submissions/page.js`, `submissions/[slug]/page.js`.
- `src/app/admin/reviews/page.js`, `reviews/new/page.js`, `reviews/[id]/edit/page.js`.
- `src/app/admin/comparisons/page.js`, `comparisons/new/page.js`, `comparisons/[id]/edit/page.js`.
- `src/app/admin/blogs/page.js`, `blogs/new/page.js`, `blogs/[id]/edit/page.js`.
- `src/app/admin/page.js` and `src/app/admin/affiliate/page.js`: feedback/loading or label semantics where applicable; dashboard and affiliate styling is provided through the shared admin stylesheet.
- `scripts/check-admin-ui.cjs` (new read-only verification script).

## Verification and remaining issues

- `npm run build` passed. The initial sandboxed attempt could not download the existing Google fonts; rerunning with network access passed without changing the fonts or public layout.
- New table component, verification script, and product/deal/review list lint checks pass with only existing image-optimization warnings.
- Full admin lint reports ten existing React hook errors in the legacy loaders and AdminShell profile loader, plus warnings. Those loaders and authentication behavior were preserved; no lint rules were disabled.
- Isolated browser checks render the actual AdminShell and table components with real `/api/categories` records. At 320, 375, 430, 768, 1024, and 1440px, these components have no page horizontal overflow. Screenshots and measurements are in `admin-design-review/`. This is a component test, not an authenticated end-to-end test of every admin route.
- Tested all five record-delete cancellation paths and submission-rejection cancellation: each asks for confirmation and makes no API request when canceled.
- The preview browser has no authenticated admin session. Protected pages, editor submissions, publishing/moderation, AI generation, and affiliate writes were not executed; no records were created, edited, or deleted. API handlers, endpoints, headers, and authentication checks were retained.
- Existing build warnings concerning metadata, the external lockfile, and dynamic public-page prerender attempts remain outside this admin UI update.
