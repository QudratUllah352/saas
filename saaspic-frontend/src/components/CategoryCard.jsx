import Link from "next/link";

import { categories, canonicalSlug } from '@/lib/categories';
const categoryIcons = Object.fromEntries(categories.map((category) => [category.slug, category.icon]));

export default function CategoryCard({
  name,
  slug,
  description,
}) {
  const icon =
    categoryIcons[canonicalSlug(slug)] || "✦";

  return (
    <Link
      href={`/deals?category=${encodeURIComponent(canonicalSlug(slug))}`}
      className="premium-category-card"
    >
      <div className="premium-category-top">
        <div className="premium-category-icon">
          {icon}
        </div>

        <span className="premium-category-arrow">
          ↗
        </span>
      </div>

      <div className="premium-category-content">
        <h3>{name}</h3>

        <p>
          {description ||
            `Discover popular ${name} SaaS tools, software and deals.`}
        </p>
      </div>

      <div className="premium-category-bottom">
        <span>Explore {name}</span>
        <span>→</span>
      </div>
    </Link>
  );
}