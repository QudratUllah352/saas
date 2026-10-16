import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import { pageMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOfferStatus } from "@/lib/dealDates";
import { canonicalSlug } from "@/lib/categories";

import Navbar from "../../components/Navbar";
import DealCard from "../../components/DealCard";
import DealsFilter from "../../components/DealsFilter";
import Footer from "../../components/Footer";

async function getDeals() {
  const response = await fetch(`${API_URL}/deals`, {
    cache: "no-store",
      signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch deals");
  }

  return response.json();
}

async function getCategories() {
  const response = await fetch(`${API_URL}/categories`, {
    cache: "no-store",
      signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch deal categories");
  }

  const categories = await response.json();
  if (!Array.isArray(categories)) {
    throw new Error("Invalid deal categories response");
  }
  return categories;
}

function categorySelection(params, categories) {
  for (const key of ["category", "search", "sort"]) {
    if (params?.[key] !== undefined && typeof params[key] !== "string") notFound();
  }
  const slug = canonicalSlug(params?.category) || "all";
  const category = categories.find((item) => item.slug === slug);
  if (slug !== "all" && !category) notFound();
  return { slug, name: category?.name };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = categorySelection(params, await getCategories());
  const searching = Boolean(params?.search?.trim());
  const title = searching ? "Search SaaS Deals" : category.name ? `${category.name} Deals` : "SaaS Deals";
  const description = searching
    ? "Search the SaaSpin deal listings by product name, description or category. Confirm current offer terms with the provider."
    : category.name
      ? `Browse ${category.name} deal listings on SaaSpin. Explore product information, listed pricing and offer schedules.`
      : "Browse SaaS deal listings and filter software offers by category.";
  const metadata = pageMetadata({ title, description,
    path: category.slug === "all" ? "/deals" : `/deals?category=${encodeURIComponent(category.slug)}`,
  });
  // Category filters are not editorial landing pages. Revisit once useful guides exist.
  if (category.slug !== "all" || searching) metadata.robots = { index: false, follow: true };
  return metadata;
}

export default async function DealsPage({ searchParams }) {
  const [deals, categories] = await Promise.all([getDeals(), getCategories()]);

  const params = await searchParams;

  const sort = params?.sort || "latest";
  const selection = categorySelection(params, categories);
  const selectedCategory = selection.slug;
  const selectedCategoryName = selection.name || "All SaaS";

  const search = params?.search?.toLowerCase() || "";

  let filteredDeals = [...deals];

  // =========================================
  // SORT BY DISCOUNT
  // =========================================

  if (sort === "discount") {
    filteredDeals.sort((a, b) => {
      const discountA = parseInt(a.discount) || 0;

      const discountB = parseInt(b.discount) || 0;

      return discountB - discountA;
    });
  }

  // =========================================
  // FILTER BY CATEGORY
  // =========================================

  if (selectedCategory !== "all") {
    filteredDeals = filteredDeals.filter(
      (deal) =>
        canonicalSlug(deal.product?.category?.slug) ===
        selectedCategory.toLowerCase(),
    );
  }

  // =========================================
  // SEARCH
  // =========================================

  if (search) {
    filteredDeals = filteredDeals.filter((deal) => {
      const name = deal.product?.name?.toLowerCase() || "";

      const description = deal.product?.description?.toLowerCase() || "";

      const category = deal.product?.category?.name?.toLowerCase() || "";

      return (
        name.includes(search) ||
        description.includes(search) ||
        category.includes(search)
      );
    });
  }

  return (
    <>
      <Navbar />

      <main className="deals-page public-page">
        <Breadcrumbs standalone items={[
            { name: "Home", path: "/" },
            { name: "Deals", path: "/deals" },
            ...(selection.name ? [{ name: selection.name, path: `/deals?category=${encodeURIComponent(selection.slug)}` }] : []),
          ]} />
        {/* =====================================
                    HERO
                ====================================== */}

        <section className="deals-premium-hero">
          <div className="deals-premium-glow deals-glow-one" />
          <div className="deals-premium-glow deals-glow-two" />

          <div className="deals-premium-hero-inner">
            <span className="deals-hero-badge">CURATED SAAS DEALS</span>

            <h1>
              {search ? "Search SaaS Deals" : selectedCategory !== "all" ? `${selectedCategoryName} Deals` : "SaaS Deals"}
            </h1>

            <p>
              {selectedCategory !== "all"
                ? `Explore ${selectedCategoryName} listings and confirm current pricing and offer terms with the provider.`
                : "Explore software offers by category and confirm current pricing and terms with the provider."}
            </p>

            {/* SEARCH */}

            <form action="/deals" method="GET" className="deals-hero-search">
              {selectedCategory !== "all" && (
                <input type="hidden" name="category" value={selectedCategory} />
              )}

              <input type="hidden" name="sort" value={sort} />

              <div className="deals-search-icon">⌕</div>

              <input
                type="search"
                name="search"
                aria-label="Search SaaS deals"
                defaultValue={params?.search || ""}
                placeholder="Search SaaS deals, tools or categories..."
              />

              <button type="submit">Search</button>
            </form>

            {/* HERO STATS */}

            <div className="deals-hero-stats">
              <div>
                <strong>{deals.filter(deal => getOfferStatus(deal) === "Active").length}</strong>

                <span>Active Deals</span>
              </div>

              <span className="deals-stat-divider" />

              <div>
                <strong>100%</strong>

                <span>Curated</span>
              </div>

              <span className="deals-stat-divider" />

              <div>
                <strong>SaaS</strong>

                <span>Focused</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
                    DEALS
                ====================================== */}

        <section className="deals-premium-section">
          <div className="deals-container">
            <div className="deals-section-heading">
              <div>
                <span>EXPLORE DEALS</span>

                <h2>Find your next software tool</h2>

                <p>
                  Browse deals by category or search for the software you need.
                </p>
              </div>

              <div className="deals-result-badge">
                <strong>{filteredDeals.length}</strong>

                <span>results</span>
              </div>
            </div>

            {/* FILTER */}

            <DealsFilter categories={categories} />

            {/* TOOLBAR */}

            <div className="deals-premium-toolbar">
              <div>
                <span className="deals-toolbar-label">SHOWING</span>

                <h3>
                  {selectedCategory === "all"
                    ? search
                      ? `Results for "${params?.search}"`
                      : "Latest SaaS Deals"
                    : `${selectedCategoryName} Deals`}
                </h3>

                <p>{filteredDeals.length} deals available</p>
              </div>

              {/* SORT */}

              <div className="deals-sort-buttons">
                <Link
                  href={`/deals?category=${selectedCategory}&sort=latest${
                    params?.search
                      ? `&search=${encodeURIComponent(params.search)}`
                      : ""
                  }`}
                  className={sort === "latest" ? "active" : ""}
                >
                  Latest
                </Link>

                <Link
                  href={`/deals?category=${selectedCategory}&sort=discount${
                    params?.search
                      ? `&search=${encodeURIComponent(params.search)}`
                      : ""
                  }`}
                  className={sort === "discount" ? "active" : ""}
                >
                  Biggest Discount
                </Link>
              </div>
            </div>

            {/* DEAL CARDS */}

            {filteredDeals.length > 0 ? (
              <div className="deals-grid">
                {filteredDeals.map((deal) => (
                  <DealCard key={deal._id} deal={deal} />
                ))}
              </div>
            ) : (
              <div className="deals-premium-empty">
                <div className="deals-empty-icon">⌕</div>

                <h3>No deals found</h3>

                <p>
                  We couldn&apos;t find a deal matching your current search or
                  category.
                </p>

                <Link href="/deals">View All Deals</Link>
              </div>
            )}
          </div>
        </section>

        {/* =====================================
                    SUBMIT DEAL CTA
                ====================================== */}

        <section className="deals-submit-section">
          <div className="deals-submit-card">
            <div className="deals-submit-decoration deals-decoration-one" />
            <div className="deals-submit-decoration deals-decoration-two" />

            <div className="deals-submit-content">
              <span>FOR SAAS FOUNDERS</span>

              <h2>Have a great SaaS deal?</h2>

              <p>
                Submit your software deal to SaaSpin and let our team review it
                for the platform.
              </p>

              <Link href="/submit-deal">
                Submit Your Deal
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <section className="deals-info-section public-page">
        <div className="deals-info-container">
          <div className="deals-verification">
            <span className="deals-info-label">ABOUT OUR DEALS</span>

            <h2>How SaaSpin Handles SaaS Deals</h2>

            <p>
              SaaSpin brings SaaS deals and software offers together in one
              place to make discovering useful tools easier. Submitted deals go
              through our admin review process before they are published on the
              platform.
            </p>

            <p>
              Deal information such as pricing, discounts and offer details is
              provided to help you compare available options. Because software
              companies can change their pricing and promotions, we recommend
              confirming the final price and terms on the provider&apos;s
              website before making a purchase.
            </p>
          </div>

          <div className="deals-faq">
            <span className="deals-info-label">FAQ</span>

            <h2>Frequently Asked Questions</h2>

            <div className="deals-faq-item">
              <h3>Where do SaaSpin deals come from?</h3>
              <p>
                SaaSpin can feature software deals submitted to the platform and
                offers added through our content management process. Deals are
                reviewed before being published.
              </p>
            </div>

            <div className="deals-faq-item">
              <h3>How do I use a deal?</h3>
              <p>
                Open the deal you are interested in and review its pricing,
                discount and other details. Use the deal button to visit the
                software provider&apos;s website, where you can confirm the
                current offer and complete your purchase.
              </p>
            </div>

            <div className="deals-faq-item">
              <h3>What does Lifetime Access mean?</h3>
              <p>
                A lifetime deal generally offers access to a software product
                for a one-time payment rather than a normal recurring
                subscription. The exact features, limits and terms depend on the
                software provider, so always check the provider&apos;s current
                terms before purchasing.
              </p>
            </div>

            <div className="deals-faq-item">
              <h3>Does SaaSpin use affiliate links?</h3>
              <p>
                Some links on SaaSpin may be affiliate links. When applicable,
                SaaSpin may earn a commission if you make a purchase through one
                of these links, at no additional cost to you.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
