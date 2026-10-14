"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { canonicalSlug } from '@/lib/categories';

export default function DealsFilter({ categories = [] }) {
  const options = [{ name: "All Categories", slug: "all" }, ...categories];
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory =
    canonicalSlug(searchParams.get("category")) || "all";

  function handleCategory(category) {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (category.slug === "all") {
      params.delete("category");
    } else {
      params.set("category", category.slug);
    }

    const queryString = params.toString();

    router.push(
      queryString
        ? `/deals?${queryString}`
        : "/deals"
    );
  }

  return (
    <div className="deals-category-filter">

      <div className="deals-category-heading">
        <span>FILTER BY CATEGORY</span>

        <p>
          Choose a category to discover relevant SaaS deals.
        </p>
      </div>

      <div className="deals-category-buttons">

        {options.map((category) => {
          const active =
            currentCategory === category.slug;

          return (
            <button
              key={category.slug}
              type="button"
              aria-pressed={active}
              className={active ? "active" : ""}
              onClick={() =>
                handleCategory(category)
              }
            >
              {category.name}
            </button>
          );
        })}

      </div>

    </div>
  );
}
