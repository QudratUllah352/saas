"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(cleanedQuery)}`
    );
  }

  return (
    <section className="home-search-section">
      <div className="home-search-container">

        <div className="home-search-card">

          <div className="home-search-heading">
            <span>FIND YOUR SOFTWARE</span>

            <h2>
              What SaaS tool are you looking for?
            </h2>

            <p>
              Search deals, software reviews,
              comparisons and useful SaaS tools.
            </p>
          </div>

          <form
            className="home-search-form"
            onSubmit={handleSubmit}
          >
            <div className="home-search-input-wrapper">

              <span
                className="home-search-icon"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search for CRM, AI tools, marketing software..."
                aria-label="Search SaaSpin"
              />

              <button type="submit">
                Search
              </button>

            </div>
          </form>

          <div className="home-search-suggestions">
            <span>Popular:</span>

            <button
              type="button"
              onClick={() =>
                router.push("/search?q=AI")
              }
            >
              AI
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/search?q=CRM")
              }
            >
              CRM
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/search?q=Productivity")
              }
            >
              Productivity
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/search?q=Marketing")
              }
            >
              Marketing
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}