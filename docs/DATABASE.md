# SaaSpin Database

Database:

MongoDB

ODM:

Mongoose

---

# Main Collections

## Category

Represents SaaS categories.

Examples:

AI
Marketing
CRM
Finance
Design
Analytics
Productivity
Development

Important fields:

- name
- slug

---

## Product

Represents a SaaS software product.

Important information includes:

- name
- slug
- description
- shortDescription
- website
- logo
- category
- features
- targetAudience
- integrations
- pricingInfo
- strengths
- limitations
- affiliate

Product means a software/SaaS product, not a physical product.

---

## Product Affiliate Data

Private fields:

- affiliate.url
- affiliate.programName
- affiliate.network
- affiliate.commissionType
- affiliate.commissionValue

Public-safe fields:

- affiliate.enabled
- affiliate.disclosureText

Never return private affiliate fields from public APIs.

---

## Deal

Represents an offer for a Product.

Important fields:

- product
- discount
- price
- oldPrice
- dealUrl
- dealType
- isActive
- startDate
- endDate

Deal types include:

- lifetime
- annual
- monthly
- other

---

## Review

Represents an editorial review of a Product.

Reviews may contain:

- product
- title
- slug
- excerpt
- introduction
- overview
- verdict
- pros
- cons
- alternatives
- publication status

Only published reviews belong on public pages.

---

## Comparison

Compares two SaaS products.

Important relationships:

- productA
- productB

Comparison content may describe:

- strengths
- limitations
- best-for use cases
- feature differences
- pricing differences
- conclusion

Avoid automatically declaring a product the winner.

---

## Blog

Editorial SaaS content.

May contain:

- title
- slug
- excerpt
- introduction
- sections
- conclusion
- category
- tags
- relatedProducts
- publication status

Only published blogs should appear publicly.

---

## DealSubmission

Stores deals submitted through the public Submit Deal page.

Admin reviews submissions before publication.

---

## Admin

Stores authorized admin accounts.

Passwords must be hashed.

Never store plain-text passwords.

---

## AffiliateClick

Stores affiliate click events.

Important fields:

- product
- source
- userAgent
- referrer
- createdAt

Supported source values:

- deal
- review
- comparison
- blog
- homepage
- search
- other