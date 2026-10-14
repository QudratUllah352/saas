# Affiliate conversion integration plan

Current data: Product affiliate settings and AffiliateClick redirect records. No approval, expiry, conversion, commission, currency, payment, or historical network records exist. Commission values in product settings describe terms; they are not earned revenue.

Before implementing an integration, obtain each network's API/postback/import specification, credentials, transaction identifiers, attribution window, currencies, and status definitions. Confirm whether network links accept a click identifier. Keep credentials server-side in environment variables or a secret store.

1. Snapshot product/category/network and an opaque click ID for future redirect events, preserving the existing redirect fallback when tracking fails. Historical attribution cannot be reconstructed reliably.
2. Add authenticated API synchronization, signed postbacks, or an admin-only report importer according to the supplied network specification. Validate signatures, payload limits, timestamps, currencies, and access controls.
3. Store conversions with a unique network + external transaction ID constraint and idempotent upserts. Keep click attribution optional and explicit; never manufacture conversions from clicks. Record adjustments and reversals without counting the same purchase twice.
4. Track commission lifecycle separately: pending, approved, rejected, paid. Store amount and currency; report currencies independently unless a documented exchange-rate policy exists. Do not sum product commission terms as revenue.
5. Publish conversion rates only for attributable, deduplicated confirmed conversions and a matching click cohort/window. Handle refunds and late updates. Add conversion/revenue sorting only once reliable records exist.
6. Validate network totals against imported reports, retry safely, log synchronization errors without credentials, and test authorization, duplicate deliveries, reversals, and payment transitions.

No external integration is enabled by this dashboard.
