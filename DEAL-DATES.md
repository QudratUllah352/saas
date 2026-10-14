# Optional deal schedules

Existing Deal fields `startDate` and `endDate` are reused. No migration was run and no MongoDB records were modified, created, or deleted during implementation or testing.

## Behavior

- Admins can set optional UTC start/end timestamps when editing a deal or publishing a submission. Blank end dates mean no expiry. New deals default to no dates; existing stored dates retain their values.
- API create/update/publish handlers accept ISO timestamps with `Z` or an explicit offset, reject invalid dates and ambiguous local timestamps, and require end > start when both are set. Partial edits validate against retained date values.
- Status precedence: manually disabled → Inactive; end <= now → Expired; start > now → Upcoming; otherwise Active. Undated active deals remain Active.
- Public listing, category, and search queries exclude expired and manually disabled offers. Upcoming published offers remain discoverable with their own status. Published expired deal URLs remain available as informational detail pages.
- Public cards, related cards, detail pages, and review offer panels show UTC dates and remaining time where applicable. Date-based UI updates at boundaries and at most every 30 seconds while a future boundary exists.
- Offer CTA links render only while the offer is Active, and recheck availability on click. Existing affiliate destinations, tracking source parameters, and sponsored attributes are preserved. General product website links remain available independently of a deal.
- Review and AI content deal lookups select only currently active offers, so future/expired promotions are not supplied as current deals.
- Existing category filters, search matching, discount sorting, public routes, auth guards, and moderation/publication flags remain in place. No new API routes were needed.

## Modified files

Backend:

- `saaspic-backend/models/Deal.js`.
- `saaspic-backend/utils/dealDates.js` (new).
- `saaspic-backend/controllers/dealController.js`, `dealSubmissionController.js`, `searchController.js`, `reviewController.js`, `aiReviewController.js`, `aiComparisonController.js`, `aiBlogController.js`.
- `saaspic-backend/scripts/dealDates.test.js` (new).

Frontend:

- `saaspic-frontend/src/lib/dealDates.js` (new).
- `saaspic-frontend/src/components/OfferDatesFields.jsx`, `OfferTiming.jsx`, `offer-dates.css` (new).
- `saaspic-frontend/src/components/DealCard.jsx`.
- `saaspic-frontend/src/app/admin/deals/page.js`, `admin/deals/[id]/edit/page.js`, `admin/submissions/page.js`.
- `saaspic-frontend/src/app/deals/page.js`, `deals/[slug]/page.js`, `reviews/[slug]/page.js`, `search/page.js`.
- `saaspic-frontend/scripts/offerDates.test.cjs` (new).

## Verification

Backend date parsing, schema validation, time-zone offsets, strict ordering, optional dates, exact boundaries, visibility predicates, and rejected partial updates passed. Frontend tests cover UTC rendering, remaining time, upcoming/expired/inactive CTA suppression, undated affiliate tracking, and optional labeled admin inputs. Tests use in-memory fixtures and never connect to MongoDB.

Commands:

```powershell
# Backend directory
node --test scripts/dealDates.test.js
# Frontend directory
node --test scripts/offerDates.test.cjs
npm run build
```

Frontend production build and targeted lint passed; existing image-optimization and build warnings remain. No authenticated date-saving or publishing calls were executed against the database. Restart/redeploy the backend and frontend together to use the updated query and UI behavior.
