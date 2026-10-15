import "@/app/public-pages.css";
import { getOfferStatus } from "@/lib/dealDates";
import { API_URL } from "@/lib/api";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

async function searchWebsite(query) {
  if (!query) {
    return {
      query: "",
      total: 0,
      products: [],
      deals: [],
      reviews: [],
      comparisons: [],
      blogs: [],
    };
  }

  try {
    const response = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(
        query
      )}`,
      {
        cache: "no-store",
      signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Search request failed."
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Search error:",
      error
    );

    return {
      query,
      total: 0,
      products: [],
      deals: [],
      reviews: [],
      comparisons: [],
      blogs: [],
      error: true,
    };
  }
}

export default async function SearchPage({
  searchParams,
}) {
  // Next.js 16
  const params = await searchParams;

  const query =
    typeof params?.q === "string"
      ? params.q.trim()
      : "";

  const results =
    await searchWebsite(query);

  return (
    <>
      <Navbar />

      <main className="global-search-page public-page">

        {/* SEARCH HEADER */}

        <section className="global-search-hero">

          <div className="global-search-container">

            <span className="global-search-eyebrow">
              SaaSpin Search
            </span>

            <h1>
              Search SaaSpin
            </h1>

            <form
              action="/search"
              method="GET"
              className="global-search-form"
            >
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search products, deals, reviews, comparisons and blogs..."
              />

              <button type="submit">
                Search
              </button>
            </form>

          </div>

        </section>


        {/* RESULTS */}

        <section className="global-search-results">

          {!query ? (

            <div className="global-search-empty">

              <h2>
                What are you looking for?
              </h2>

              <p>
                Search for SaaS products,
                deals, reviews, comparisons
                and articles.
              </p>

            </div>

          ) : results.error ? (

            <div className="global-search-empty">

              <h2>
                Search is temporarily
                unavailable
              </h2>

              <p>
                Please try again.
              </p>

            </div>

          ) : results.total === 0 ? (

            <div className="global-search-empty">

              <h2>
                No results found
              </h2>

              <p>
                We couldn&apos;t find anything
                matching &quot;{query}&quot;.
              </p>

            </div>

          ) : (

            <>
              <div className="global-search-summary">

                <div>
                  <h2>
                    Search results
                  </h2>

                  <p>
                    Results for{" "}
                    <strong>
                      &quot;{query}&quot;
                    </strong>
                  </p>
                </div>

                <span>
                  {results.total}{" "}
                  {results.total === 1
                    ? "result"
                    : "results"}
                </span>

              </div>


              {/* PRODUCTS */}

              {results.products?.length >
                0 && (

                <SearchSection
                  title="Products"
                  count={
                    results.products.length
                  }
                >
                  {results.products.map(
                    (product) => (

                      <SearchResultCard
                        key={product._id}
                        type="Product"
                        title={product.name}
                        description={
                          product.shortDescription ||
                          product.description
                        }
                        href={`/deals?search=${encodeURIComponent(
                          product.name
                        )}`}
                        image={product.logo}
                        meta={
                          product.category?.name
                        }
                      />

                    )
                  )}
                </SearchSection>

              )}


              {/* DEALS */}

              {results.deals?.length >
                0 && (

                <SearchSection
                  title="Deals"
                  count={
                    results.deals.length
                  }
                >
                  {results.deals.map(
                    (deal) => (

                      <SearchResultCard
                        key={deal._id}
                        type="Deal"
                        title={
                          deal.product?.name ||
                          "SaaS Deal"
                        }
                        description={
                          deal.discount
                            ? `${deal.discount} ? ${getOfferStatus(deal)} offer`
                            : "View this SaaS deal"
                        }
                        href={`/deals/${deal._id}`}
                        image={
                          deal.product?.logo
                        }
                        meta={
                          deal.product
                            ?.category?.name
                        }
                      />

                    )
                  )}
                </SearchSection>

              )}


              {/* REVIEWS */}

              {results.reviews?.length >
                0 && (

                <SearchSection
                  title="Reviews"
                  count={
                    results.reviews.length
                  }
                >
                  {results.reviews.map(
                    (review) => (

                      <SearchResultCard
                        key={review._id}
                        type="Review"
                        title={review.title}
                        description={
                          review.excerpt
                        }
                        href={`/reviews/${review.slug}`}
                        image={
                          review.product?.logo
                        }
                        meta={
                          review.product?.name
                        }
                      />

                    )
                  )}
                </SearchSection>

              )}


              {/* COMPARISONS */}

              {results.comparisons?.length >
                0 && (

                <SearchSection
                  title="Comparisons"
                  count={
                    results.comparisons
                      .length
                  }
                >
                  {results.comparisons.map(
                    (comparison) => (

                      <SearchResultCard
                        key={comparison._id}
                        type="Comparison"
                        title={
                          comparison.title
                        }
                        description={
                          comparison.excerpt
                        }
                        href={`/comparisons/${comparison.slug}`}
                        meta={
                          comparison.productA &&
                          comparison.productB
                            ? `${comparison.productA.name} vs ${comparison.productB.name}`
                            : ""
                        }
                      />

                    )
                  )}
                </SearchSection>

              )}


              {/* BLOGS */}

              {results.blogs?.length >
                0 && (

                <SearchSection
                  title="Blogs"
                  count={
                    results.blogs.length
                  }
                >
                  {results.blogs.map(
                    (blog) => (

                      <SearchResultCard
                        key={blog._id}
                        type="Article"
                        title={blog.title}
                        description={
                          blog.excerpt
                        }
                        href={`/blogs/${blog.slug}`}
                        meta={
                          blog.category
                        }
                      />

                    )
                  )}
                </SearchSection>

              )}

            </>
          )}

        </section>

      </main>

      <Footer />
    </>
  );
}


function SearchSection({
  title,
  count,
  children,
}) {
  return (
    <section className="global-search-section">

      <div className="global-search-section-header">

        <h2>{title}</h2>

        <span>
          {count}
        </span>

      </div>

      <div className="global-search-grid">
        {children}
      </div>

    </section>
  );
}


function SearchResultCard({
  type,
  title,
  description,
  href,
  image,
  meta,
}) {
  return (
    <Link
      href={href}
      className="global-search-card"
    >

      <div className="global-search-card-logo">

        {image ? (
          <img
            src={image}
            alt={title}
          />
        ) : (
          <span>
            {title
              ?.charAt(0)
              .toUpperCase()}
          </span>
        )}

      </div>


      <div className="global-search-card-content">

        <div className="global-search-card-top">

          <span className="global-search-type">
            {type}
          </span>

          {meta && (
            <span className="global-search-meta">
              {meta}
            </span>
          )}

        </div>

        <h3>{title}</h3>

        {description && (
          <p>
            {description}
          </p>
        )}

        <span className="global-search-open">
          View →
        </span>

      </div>

    </Link>
  );
}
