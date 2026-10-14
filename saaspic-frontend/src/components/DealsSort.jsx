"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DealsSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "latest";

  function handleSort(event) {
    const sort = event.target.value;

    const params = new URLSearchParams(searchParams.toString());

    if (sort === "latest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }

    const query = params.toString();

    router.push(
      query ? `?${query}` : window.location.pathname
    );
  }

  return (
    <div className="deals-sort">

      <label htmlFor="sort">
        Sort by:
      </label>

      <select
        id="sort"
        value={currentSort}
        onChange={handleSort}
      >
        <option value="latest">
          Latest
        </option>

        <option value="rating">
          Highest Rated
        </option>

        <option value="discount">
          Biggest Discount
        </option>
      </select>

    </div>
  );
}

