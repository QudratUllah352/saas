# SaaSpin SEO Rules

## Goal

Public SaaSpin content should be discoverable by search engines.

Admin content must not be indexed.

---

# Indexable Pages

/

/deals

/deals/[deal-id]

/reviews

/reviews/[slug]

/comparisons

/comparisons/[slug]

/blogs

/blogs/[slug]

---

# Non-Indexable Pages

/admin

/admin/*

Admin pages must use:

noindex
nofollow

Admin URLs must never appear in the public sitemap.

---

# Metadata

Important public pages should have:

- Unique title
- Meta description
- Canonical URL
- Open Graph title
- Open Graph description
- Open Graph image where available

---

# Dynamic SEO

Review pages should generate metadata from the Review.

Blog pages should generate metadata from the Blog.

Comparison pages should generate metadata from the Comparison.

Deal pages should generate metadata from the Product/Deal.

Do not use identical metadata for every page.

---

# Sitemap

SaaSpin should provide:

/sitemap.xml

The sitemap should contain public indexable URLs.

It must not contain admin URLs.

Only published editorial content should be included.

---

# Robots

SaaSpin should provide:

/robots.txt

Admin crawling/indexing should be restricted.

Admin pages should additionally provide noindex metadata.

robots.txt alone is not an authentication mechanism.

---

# Content SEO

Use one clear H1 per page.

Use logical:

H1
H2
H3

structure.

Avoid keyword stuffing.

Write content for humans first.

---

# Images

Images should have descriptive alt text.

Bad:

alt="image"

Better:

alt="AI Writer SaaS product logo"

---

# Internal Linking

Relevant pages should link naturally to:

- Deals
- Reviews
- Comparisons
- Blogs
- Related products

Internal links should help visitors discover related content.

---

# URLs

URLs should be readable and stable.

Editorial content should use descriptive slugs.

Example:

/reviews/ai-writer-review

instead of meaningless numeric URLs where practical.

---

# Admin SEO

Admin pages:

- No public navigation links
- No sitemap entries
- noindex
- nofollow

Authentication is still required.

Hiding Admin from search engines does not secure Admin.