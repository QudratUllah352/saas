SaaSpin UI Fix

Replace:
1. saaspic-frontend/src/app/globals.css
   with globals.css from this package.

2. saaspic-frontend/src/app/page.js
   with page.js from this package.

What was fixed:
- Removed duplicate homepage data declarations and duplicate content sections.
- Added missing homepage CSS classes.
- Added responsive layout for homepage, navbar, admin dashboard, editors, forms and tables.
- Added consistent card hover/focus behavior.
- Added mobile-safe containers and horizontal table scrolling.
- Preserved the existing stylesheet and added a final compatibility/polish layer.

Important:
- This package is based on the frontend/CSS files supplied in the conversation.
- Pages not included in the supplied source cannot be truthfully classified as CSS-complete or CSS-missing without their actual JSX.
