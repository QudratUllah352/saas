# SaaSpin Design System

## 1. Purpose

This document defines the visual design rules for SaaSpin.

All public pages, reusable components, and new frontend features
should follow this design system.

The goal is to keep SaaSpin:

- Modern
- Premium
- Clean
- Professional
- Minimal
- Consistent
- Easy to use
- Responsive
- SaaS-focused

Before creating or redesigning a page, check this document.

Do not create a completely different visual style for individual
pages unless there is a strong functional reason.

---

# 2. Brand Identity

## Brand Name

SaaSpin

## Brand Personality

SaaSpin should feel:

- Modern
- Trustworthy
- Professional
- Helpful
- Technology-focused
- Clean
- Premium without being overly decorative

The website should look like a professional SaaS discovery
platform rather than an experimental or entertainment website.

---

# 3. Core Color Palette

## Primary Purple

Hex:

#635bff

CSS variable:

--color-primary

Use for:

- Primary buttons
- Important links
- Active navigation
- Active filters
- Highlights
- Selected controls
- Important icons
- CTA elements

Do not use the primary color for large amounts of body text.

---

## Primary Hover

Hex:

#5148e5

CSS variable:

--color-primary-hover

Use when hovering over primary buttons and interactive elements.

---

## Primary Soft Background

Hex:

#f0efff

CSS variable:

--color-primary-soft

Use for:

- Light purple badges
- Selected backgrounds
- Small highlighted areas
- Category indicators

---

# 4. Neutral Colors

## Main Heading

Hex:

#111827

CSS variable:

--color-heading

Use for:

- H1
- H2
- H3
- Important text
- Dark CTA sections

---

## Body Text

Hex:

#6b7280

CSS variable:

--color-text

Use for:

- Paragraphs
- Descriptions
- Secondary information

---

## Muted Text

Hex:

#9ca3af

CSS variable:

--color-muted

Use for:

- Labels
- Metadata
- Dates
- Supporting information

Do not use muted text for important information.

---

## Main Background

Hex:

#f7f8fc

CSS variable:

--color-background

Use as the primary light page background.

---

## Surface / Card Background

Hex:

#ffffff

CSS variable:

--color-surface

Use for:

- Cards
- Forms
- Dropdowns
- Panels
- Navigation surfaces

---

## Border

Hex:

#e8e9ef

CSS variable:

--color-border

Use for normal card and input borders.

---

## Light Border

Hex:

#f0f1f5

CSS variable:

--color-border-light

Use when an extremely subtle separation is needed.

---

# 5. Status Colors

## Success

#22c55e

Variable:

--color-success

Use for:

- Active status
- Successful actions
- Available deals
- Success messages

---

## Warning

#f59e0b

Variable:

--color-warning

Use for warnings requiring user attention.

---

## Error / Danger

#ef4444

Variable:

--color-danger

Use for:

- Errors
- Failed actions
- Destructive controls
- Validation errors

Status colors should not replace the main SaaSpin brand color.

---

# 6. Typography

Use one consistent primary font throughout the public website.

The actual font should be configured globally in the Next.js
root layout.

Do not independently load different fonts inside individual pages.

CSS variable:

--font-primary

Recommended hierarchy:

## Hero H1

Approximately:

48px - 64px desktop

36px - 44px tablet/mobile

Font weight:

800

Line height:

1.05 - 1.15

---

## Page H1

Approximately:

36px - 48px

Font weight:

700 - 800

---

## Section H2

Approximately:

28px - 36px

Font weight:

700

---

## Card H3

Approximately:

16px - 20px

Font weight:

600 - 700

---

## Body Text

Approximately:

14px - 16px

Line height:

1.5 - 1.7

---

## Small Text

Approximately:

12px - 14px

---

## Labels

Approximately:

10px - 12px

Font weight:

600 - 700

Uppercase may be used sparingly for small section labels.

---

# 7. Font Weights

Use approximately:

400 = normal text

500 = medium emphasis

600 = buttons and important labels

700 = headings

800 = hero headings

Avoid using very heavy font weights everywhere.

Visual hierarchy should make important content stand out naturally.

---

# 8. Layout

## Main Content Width

Maximum content width:

1180px

CSS variable:

--container-width

Pages should normally be centered.

Example:

max-width: var(--container-width);
margin-inline: auto;

---

## Desktop Page Padding

24px

Variable:

--page-padding

---

## Mobile Page Padding

18px

Variable:

--page-padding-mobile

---

# 9. Spacing System

Use consistent spacing rather than random values.

Recommended variables:

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;

Prefer these values when creating:

- Gaps
- Padding
- Margins
- Section spacing

Avoid unnecessary values such as:

17px
29px
43px

unless the design genuinely requires them.

---

# 10. Border Radius

## Small Controls

8px

Variable:

--radius-small

Use for:

- Small inputs
- Compact controls

---

## Buttons

10px

Variable:

--radius-button

---

## Cards

16px

Variable:

--radius-card

---

## Large Sections

20px

Variable:

--radius-large

---

## Pills / Badges

999px

Variable:

--radius-pill

Use for:

- Category badges
- Status pills
- Small filters

---

# 11. Shadows

SaaSpin should use subtle shadows.

Avoid large, dark, dramatic shadows.

## Small Shadow

0 2px 8px rgba(17, 24, 39, 0.04)

Variable:

--shadow-small

---

## Card Shadow

0 5px 18px rgba(17, 24, 39, 0.035)

Variable:

--shadow-card

---

## Card Hover Shadow

0 18px 45px rgba(17, 24, 39, 0.09)

Variable:

--shadow-card-hover

---

## Primary Button Shadow

0 8px 18px rgba(99, 91, 255, 0.20)

Variable:

--shadow-primary

---

# 12. Buttons

SaaSpin has three main button styles.

## Primary Button

Use for the most important action.

Style:

- Purple background
- White text
- 10px border radius
- Medium or semibold text
- Comfortable padding
- Subtle shadow
- Darker purple hover state

Example uses:

- View Deal
- Submit Deal
- Generate
- Save
- Search

---

## Secondary Button

Style:

- White or light background
- Dark text
- Subtle border
- No excessive shadow

Example uses:

- Cancel
- Back
- Secondary navigation

---

## Dark CTA Button

Used inside dark CTA sections.

Style:

- White/light button on dark background
OR
- Purple button with strong contrast

---

## Button Rules

Buttons should:

- Clearly look clickable
- Have hover feedback
- Have visible focus states
- Be large enough for touch screens
- Use consistent radius
- Use consistent font weight

Avoid excessive button animations.

---

# 13. Cards

Cards are one of the main SaaSpin UI elements.

Standard card:

background: var(--color-surface);

border:
1px solid var(--color-border);

border-radius:
var(--radius-card);

box-shadow:
var(--shadow-card);

Cards should normally contain:

- Clear heading
- Short supporting content
- Appropriate metadata
- One obvious action when needed

---

## Card Hover

Interactive cards may:

- Move slightly upward
- Increase shadow
- Change border subtly

Do not create dramatic movement.

Recommended transition:

0.25s ease

---

# 14. Deal Cards

Deal cards should normally display:

- Category
- Discount
- Product logo
- Product name
- Short description
- Deal price
- Old price when available
- Deal type
- Active status
- View Deal button

The Deal Card should link to the internal SaaSpin deal detail page.

Do NOT send users directly to the affiliate URL from the normal
Deal Card.

Affiliate tracking happens from the appropriate CTA on the
detail/content page.

---

# 15. Product Logos

Product logos should:

- Maintain aspect ratio
- Have appropriate alt text
- Fit within a consistent logo container
- Not stretch
- Not dominate the card

If no logo exists, a clean fallback using the first letter of the
product name may be displayed.

---

# 16. Badges

Badges should be small and restrained.

Use for:

- Categories
- Discounts
- Deal types
- Status
- Content labels

Do not use large badge elements as major page content.

---

# 17. Inputs

Inputs should have:

- White background
- Subtle border
- Consistent radius
- Comfortable padding
- Visible focus state

Focus should preferably use the SaaSpin primary color.

Example:

border-color: var(--color-primary);

Avoid removing focus visibility completely.

---

# 18. Forms

Forms should:

- Clearly label important fields
- Show validation errors near the field
- Keep related fields together
- Avoid unnecessarily wide fields
- Use consistent spacing
- Have a clear primary submit action

Admin forms can be more information-dense than public forms but
should still follow the same visual language.

---

# 19. Navbar

The Navbar should:

- Display the SaaSpin brand clearly
- Keep navigation simple
- Highlight interactive states
- Work on desktop and mobile
- Avoid unnecessary clutter

Main public navigation includes:

- Deals
- Reviews
- Comparisons
- Blog
- Search
- Submit Deal

Admin should NOT appear in the public Navbar.

Deal category navigation should use:

/deals?category=ai

/deals?category=productivity

/deals?category=marketing

etc.

---

# 20. Hero Sections

Hero sections should normally contain:

- Small badge or eyebrow text when useful
- One clear H1
- Supporting description
- Primary action/search
- Optional supporting statistics

Hero sections should not contain excessive text.

The main message should be understandable quickly.

---

# 21. Search

Search should be easy to find.

Main search controls should:

- Have a clear placeholder
- Use a visible search button/action
- Work well on mobile
- Have sufficient contrast

Avoid placing multiple identical search fields on the same page
unless they serve different purposes.

---

# 22. Page Structure

Typical public page structure:

Navbar
↓
Hero / Page Header
↓
Primary Content
↓
Supporting Content
↓
Optional CTA
↓
Why SaaSpin
↓
Footer

Not every page requires every section.

Do not add sections only to make pages longer.

---

# 23. Homepage Structure

Preferred homepage structure:

Navbar

Premium Hero

Main Search

Featured Deals

Categories

Reviews

Comparisons

Blogs

Submit Deal CTA

Why SaaSpin

Footer

Do not reintroduce a newsletter section unless the project
requirements change.

---

# 24. Deals Page

The Deals page should use:

/deals

Category filters use query parameters:

/deals?category=ai

The page should include:

- Deals hero
- Search
- Category filters
- Sorting
- Deal cards
- Empty state
- Submit Deal CTA where appropriate
- Why SaaSpin
- Footer

---

# 25. Reviews

Review pages should prioritize readability.

Review content may include:

- Product information
- Introduction
- Overview
- Features
- Strengths
- Limitations
- Pricing information
- Alternatives
- Final editorial summary
- Product CTA

Do not overwhelm editorial pages with unnecessary decorative UI.

---

# 26. Comparisons

Comparison pages should make differences easy to understand.

Use:

- Clear product identification
- Feature comparison
- Strengths
- Limitations
- Pricing information
- Best-for use cases

Avoid visually implying a product is the winner unless the content
specifically and appropriately supports that conclusion.

---

# 27. Blogs

Blog pages should prioritize long-form readability.

Use:

- Comfortable line height
- Reasonable content width
- Clear heading hierarchy
- Related SaaS products when relevant
- Internal links
- Good mobile typography

Avoid overly wide article paragraphs.

---

# 28. Affiliate CTA

Affiliate CTA elements must visually fit the SaaSpin design.

Affiliate links should:

- Clearly describe the action
- Open safely
- Include appropriate sponsored relationship attributes
- Display disclosure text when affiliate marketing is enabled

Use:

rel="noopener noreferrer sponsored"

Affiliate disclosure should be visible but should not overwhelm
the page.

---

# 29. Why SaaSpin

The Why SaaSpin section should communicate the main value of the
platform.

Current concepts:

- Curated SaaS Deals
- Detailed Reviews
- Software Comparisons
- Useful SaaS Insights

Keep this section consistent across appropriate public pages.

---

# 30. Footer

The Footer should provide useful navigation without excessive
content.

It may contain links to:

- Deals
- Reviews
- Comparisons
- Blogs
- Submit Deal
- Affiliate Disclosure

Admin should not be linked publicly.

---

# 31. Responsive Design

All new UI must be responsive.

Recommended behavior:

## Desktop

Three-column grids where appropriate.

## Tablet

Two-column grids where appropriate.

## Mobile

Single-column layout.

Navigation should switch to a mobile-friendly design.

---

# 32. Mobile Rules

On smaller screens:

- Avoid horizontal overflow
- Stack complex layouts
- Keep buttons touch-friendly
- Reduce hero heading sizes
- Keep readable page padding
- Keep forms usable
- Avoid tiny text
- Avoid overcrowded navigation

Test important pages at mobile widths.

---

# 33. Accessibility

Design should consider accessibility.

Use:

- Semantic HTML
- Proper headings
- Descriptive alt text
- Keyboard-accessible controls
- Visible focus states
- Sufficient color contrast
- Proper form labels

Do not rely only on color to communicate important information.

---

# 34. Images

Images should:

- Have meaningful alt text
- Maintain aspect ratio
- Avoid layout shifts where practical
- Be appropriately optimized

Bad:

alt="image"

Better:

alt="AI Writer SaaS product logo"

Decorative images may use an empty alt attribute where appropriate.

---

# 35. Animation

Animation should be subtle.

Good:

- Small hover movement
- Smooth color transition
- Dropdown transitions
- Small card elevation

Avoid:

- Constant movement
- Large bouncing effects
- Excessive scaling
- Long animations
- Distracting page transitions

Recommended transitions:

--transition-fast: 0.15s ease;

--transition-normal: 0.25s ease;

--transition-slow: 0.35s ease;

---

# 36. Z-Index

Use a predictable z-index system.

Recommended:

--z-dropdown: 100;

--z-navbar: 500;

--z-modal: 1000;

Avoid random values such as:

99999999

unless absolutely necessary.

---

# 37. CSS Variables

New components should prefer global CSS variables.

Example:

background: var(--color-primary);

instead of:

background: #635bff;

Example:

border-radius: var(--radius-card);

instead of:

border-radius: 16px;

This makes future design changes easier.

---

# 38. Reusable Components

Before creating a new component, check whether an existing
component already solves the problem.

Existing reusable concepts include:

- Navbar
- DealCard
- ReviewCard
- ComparisonCard
- BlogCard
- AffiliateButton
- WhySaaSpin
- Footer

Prefer improving reusable components over copying the same markup
into multiple pages.

---

# 39. Public vs Admin Design

The public website should be:

- Marketing-focused
- Spacious
- Visually polished

Admin can be:

- More compact
- Data-focused
- Form-focused

However, both should still use the same:

- Brand colors
- Typography
- Radius system
- Spacing logic
- Buttons
- Form styling

---

# 40. SEO-Friendly Design

Visual design should support SEO and semantic structure.

Use:

One main H1 per page.

Logical:

H1
H2
H3

hierarchy.

Do not use heading tags only because they have a desired font size.

Use CSS for appearance and semantic HTML for document meaning.

---

# 41. Content Length

Cards should contain concise descriptions.

Long editorial content belongs on detail pages.

Avoid placing full articles inside listing cards.

---

# 42. Empty States

When no content exists, display a helpful empty state.

Example:

"No deals were found for this category."

Where appropriate, provide a useful next action.

Do not leave completely blank areas.

---

# 43. Loading States

Pages that load client-side data should provide clear loading
feedback when appropriate.

Loading states should visually fit SaaSpin.

Avoid large distracting loading animations.

---

# 44. Error States

Errors should:

- Explain what happened in understandable language
- Avoid exposing server internals
- Provide a retry or navigation option when useful

Do not display:

- Database credentials
- Stack traces
- Secret environment variables
- Internal API keys

---

# 45. Design Consistency Rule

Before building a new page:

1. Check an existing SaaSpin page.
2. Check this design system.
3. Reuse existing components where possible.
4. Reuse global CSS variables.
5. Follow the existing spacing system.
6. Follow existing card/button patterns.
7. Make the page responsive.
8. Check mobile behavior.

Do not independently invent a new design language.

---

# 46. Rules for AI Coding Assistants

When an AI coding assistant modifies SaaSpin:

- Read this file first.
- Preserve existing working functionality.
- Follow the established visual identity.
- Use global design variables.
- Reuse existing components.
- Do not introduce random colors.
- Do not introduce unrelated fonts.
- Do not create unnecessary duplicate components.
- Do not rewrite large working CSS sections without a reason.
- Inspect existing files before replacing them.
- Keep desktop and mobile layouts responsive.

If existing code conflicts with this document, inspect the
existing implementation before changing it rather than blindly
rewriting the page.

---

# 47. Global Design Tokens

The frontend should gradually standardize around these tokens:

```css
:root {
  --color-primary: #635bff;
  --color-primary-hover: #5148e5;
  --color-primary-soft: #f0efff;

  --color-heading: #111827;
  --color-text: #6b7280;
  --color-muted: #9ca3af;

  --color-background: #f7f8fc;
  --color-surface: #ffffff;

  --color-border: #e8e9ef;
  --color-border-light: #f0f1f5;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --container-width: 1180px;

  --page-padding: 24px;
  --page-padding-mobile: 18px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  --radius-small: 8px;
  --radius-button: 10px;
  --radius-card: 16px;
  --radius-large: 20px;
  --radius-pill: 999px;

  --shadow-small:
    0 2px 8px rgba(17, 24, 39, 0.04);

  --shadow-card:
    0 5px 18px rgba(17, 24, 39, 0.035);

  --shadow-card-hover:
    0 18px 45px rgba(17, 24, 39, 0.09);

  --shadow-primary:
    0 8px 18px rgba(99, 91, 255, 0.20);

  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s ease;

  --z-dropdown: 100;
  --z-navbar: 500;
  --z-modal: 1000;
}