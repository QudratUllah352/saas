import Link from "next/link";
import { categories as mainCategories } from "@/lib/categories";
import { getSiteUrl, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { fetchPublicList } from "@/lib/public-api";
import CategoryCard from "../components/CategoryCard";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchBar from "../components/SearchBar";
import DealCard from "../components/DealCard";
import ReviewCard from "../components/ReviewCard";
import ComparisonCard from "../components/ComparisonCard";
import BlogCard from "../components/BlogCard";
import WhySaaSpin from "../components/WhySaaSpin";
import Footer from "../components/Footer";


async function fetchHomepageData(endpoint) {
  return fetchPublicList(endpoint);
}

export const metadata = { ...pageMetadata({
  "title": "SaaS Deals, Reviews & Comparisons",
  "description": "Discover SaaS deals, read software reviews, compare products, and explore practical SaaS guides.",
  "path": "/"
}), title: { absolute: "SaaS Deals, Reviews & Comparisons | SaaSpin" } };

export default async function Home() {
  const [categoryData, deals, reviews, comparisons, blogs] =
    await Promise.all([
      fetchHomepageData("/categories"),
      fetchHomepageData("/deals"),
      fetchHomepageData("/reviews"),
      fetchHomepageData("/comparisons"),
      fetchHomepageData("/blogs"),
    ]);

  const categories = mainCategories.map((category) => ({ ...category, ...categoryData.find((item) => item.slug === category.slug) }));

  const featuredDeals = deals.slice(0, 4);
  const latestReviews = reviews.slice(0, 3);
  const latestComparisons = comparisons.slice(0, 3);
  const latestBlogs = blogs.slice(0, 3);

  return (
    <>
      <Navbar />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "SaaSpin", url: getSiteUrl() }} />

      <main className="public-home">
        <Hero
          featuredReview={latestReviews[0]}
          totalReviews={reviews.length}
          totalDeals={deals.length}
        />
        <SearchBar />

        <section className="premium-deals-section" id="deals">
          <div className="home-container">

            <div className="premium-section-header">
              <div className="premium-section-title">
                <span className="premium-eyebrow">
                  FEATURED DEALS
                </span>

                <h2>
                  Save more on software
                  <br />
                  your business actually needs.
                </h2>

                <p>
                  Explore selected SaaS deals across productivity,
                  marketing, AI, design, development and more.
                </p>
              </div>

              <Link
                href="/deals"
                className="premium-section-link"
              >
                View all deals
                <span>→</span>
              </Link>
            </div>

            {featuredDeals.length > 0 ? (
              <div className="premium-deals-grid">
                {featuredDeals.map((deal) => (
                  <DealCard
                    key={deal._id}
                    deal={deal}
                  />
                ))}
              </div>
            ) : (
              <div className="premium-empty-state">
                <span>✦</span>

                <h3>No active deals yet</h3>

                <p>
                  New SaaS deals will appear here when they
                  become available.
                </p>
              </div>
            )}

          </div>
        </section>

        <section className="premium-categories-section" id="categories">
          <div className="home-container">

            <div className="premium-categories-header">

              <div className="premium-section-title">
                <span className="premium-eyebrow">
                  EXPLORE CATEGORIES
                </span>

                <h2>
                  Find the right software
                  <br />
                  for the way you work.
                </h2>

                <p>
                  Browse SaaS tools by category and discover
                  software designed for different parts of
                  your business.
                </p>
              </div>

              <Link
                href="/deals"
                className="premium-section-link"
              >
                Browse all software
                <span>→</span>
              </Link>

            </div>

            {categories.length > 0 ? (
              <div className="premium-categories-grid">

                {categories.map((category) => (
                  <CategoryCard
                    key={category.slug}
                    name={category.name}
                    slug={category.slug}
                    description={category.description}
                  />
                ))}

              </div>
            ) : (
              <div className="premium-empty-state">
                <span>✦</span>

                <h3>No categories available</h3>

                <p>
                  Software categories will appear here.
                </p>
              </div>
            )}

          </div>
        </section>

        <section className="premium-reviews-section" id="reviews">

          <div className="home-container">

            <div className="premium-reviews-header">

              <div className="premium-section-title">

                <span className="premium-eyebrow">
                  SOFTWARE REVIEWS
                </span>

                <h2>
                  Understand the software
                  <br />
                  before you choose it.
                </h2>

                <p>
                  Explore detailed SaaS reviews covering features,
                  pricing, strengths, limitations and who each
                  product is best suited for.
                </p>

              </div>


              <Link
                href="/reviews"
                className="premium-section-link"
              >
                View all reviews

                <span>→</span>
              </Link>

            </div>


            {latestReviews.length > 0 ? (

              <div className="premium-reviews-grid">

                {latestReviews.map((review) => (

                  <ReviewCard
                    key={review._id}
                    review={review}
                  />

                ))}

              </div>

            ) : (

              <div className="premium-empty-state">

                <span>★</span>

                <h3>
                  No published reviews yet
                </h3>

                <p>
                  Detailed software reviews will appear here.
                </p>

              </div>

            )}

          </div>

        </section>

        <section className="premium-comparisons-section" id="comparisons">

          <div className="home-container">

            <div className="premium-comparisons-header">

              <div className="premium-section-title">

                <span className="premium-eyebrow">
                  SOFTWARE COMPARISONS
                </span>

                <h2>
                  Compare your options
                  <br />
                  side by side.
                </h2>

                <p>
                  See how SaaS products differ in features,
                  strengths, limitations and ideal use cases
                  before deciding which one fits your needs.
                </p>

              </div>

              <Link
                href="/comparisons"
                className="premium-section-link"
              >
                View all comparisons

                <span>→</span>
              </Link>

            </div>

            {latestComparisons.length > 0 ? (

              <div className="premium-comparisons-grid">

                {latestComparisons.map((comparison) => (

                  <ComparisonCard
                    key={comparison._id}
                    comparison={comparison}
                  />

                ))}

              </div>

            ) : (

              <div className="premium-empty-state">

                <span>⇄</span>

                <h3>
                  No comparisons yet
                </h3>

                <p>
                  Published software comparisons will
                  appear here.
                </p>

              </div>

            )}

          </div>

        </section>

        <section className="premium-blogs-section" id="blogs">

          <div className="home-container">

            <div className="premium-blogs-header">

              <div className="premium-section-title">

                <span className="premium-eyebrow">
                  SAAS INSIGHTS
                </span>

                <h2>
                  Guides and ideas to help
                  <br />
                  you work smarter.
                </h2>

                <p>
                  Explore practical SaaS guides, software
                  insights, productivity ideas and articles
                  designed to help you get more from your tools.
                </p>

              </div>

              <Link
                href="/blogs"
                className="premium-section-link"
              >
                Explore all articles
                <span>→</span>
              </Link>

            </div>


            {latestBlogs.length > 0 ? (

              <div className="home-blog-cards">
                {latestBlogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}

                  {latestBlogs.length === 1 && (

                    <div className="premium-blog-coming">

                      <span>MORE INSIGHTS COMING</span>

                      <h3>
                        More SaaS guides are on the way.
                      </h3>

                      <p>
                        New software guides, comparisons
                        and practical articles will appear
                        here as they are published.
                      </p>

                      <Link href="/blogs">
                        Browse articles →
                      </Link>

                    </div>

                  )}

              </div>

            ) : (

              <div className="premium-empty-state">

                <span>✦</span>

                <h3>
                  No published articles yet
                </h3>

                <p>
                  SaaS guides and software insights will
                  appear here.
                </p>

              </div>

            )}

          </div>

        </section>
      </main>
      <section className="premium-submit-section">
        <div className="home-container">

          <div className="premium-submit-card">

            <div className="premium-submit-glow premium-submit-glow-one"></div>
            <div className="premium-submit-glow premium-submit-glow-two"></div>

            <div className="premium-submit-content">

              <span className="premium-submit-badge">
                FOR SAAS FOUNDERS
              </span>

              <h2>
                Have a SaaS product
                <br />
                worth discovering?
              </h2>

              <p>
                Submit your software or SaaS deal to SaaSpin
                and put it in front of people looking for
                useful tools, deals and software solutions.
              </p>

              <div className="premium-submit-actions">

                <Link
                  href="/submit-deal"
                  className="premium-submit-primary"
                >
                  Submit your SaaS
                  <span>→</span>
                </Link>

                <Link
                  href="/deals"
                  className="premium-submit-secondary"
                >
                  Explore deals
                </Link>

              </div>

            </div>


            <div className="premium-submit-visual">

              <div className="submit-dashboard-card">

                <div className="submit-dashboard-top">

                  <div className="submit-window-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <span className="submit-dashboard-label">
                    SaaSpin
                  </span>

                </div>


                <div className="submit-dashboard-body">

                  <div className="submit-product-preview">

                    <div className="submit-product-logo">
                      S
                    </div>

                    <div>
                      <span>YOUR PRODUCT</span>
                      <strong>Your SaaS</strong>
                    </div>

                    <div className="submit-live-badge">
                      LIVE
                    </div>

                  </div>


                  <div className="submit-preview-line submit-line-large"></div>
                  <div className="submit-preview-line submit-line-medium"></div>
                  <div className="submit-preview-line submit-line-small"></div>


                  <div className="submit-preview-stats">

                    <div>
                      <span>Category</span>
                      <strong>SaaS</strong>
                    </div>

                    <div>
                      <span>Deal</span>
                      <strong>40% OFF</strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>Active</strong>
                    </div>

                  </div>

                </div>

              </div>


              <div className="submit-floating-card submit-floating-one">
                <span>✓</span>

                <div>
                  <small>Submission</small>
                  <strong>Received</strong>
                </div>
              </div>


              <div className="submit-floating-card submit-floating-two">
                <span>↗</span>

                <div>
                  <small>Discover</small>
                  <strong>New tools</strong>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          DISCOVERY & NAVIGATION BAR (ABOVE WHY SAASPIN BLOCK)
      ========================================================= */}
      <section className="home-discovery-strip-section" aria-label="SaaS Ecosystem Discovery Navigation">
        <div className="home-container">
          <div className="home-discovery-strip-card">
            <div className="home-discovery-glow glow-1" aria-hidden="true" />
            <div className="home-discovery-glow glow-2" aria-hidden="true" />

            <div className="home-discovery-top">
              <div className="home-discovery-heading-wrap">
                <span className="home-discovery-badge">
                  <span className="home-discovery-pulse" aria-hidden="true" />
                  <span>SMART SAAS NAVIGATOR</span>
                </span>
                <h3 className="home-discovery-title">
                  Done reading reviews? Jump straight into the right SaaS solution.
                </h3>
                <p className="home-discovery-subtitle">
                  Compare features side-by-side, unlock exclusive software discounts, or browse curated SaaS categories.
                </p>
              </div>

              <div className="home-discovery-metrics">
                <div className="home-discovery-metric-pill">
                  <span className="metric-icon">⚡</span>
                  <span className="metric-num">{deals.length}</span>
                  <span className="metric-label">Deals</span>
                </div>
                <div className="home-discovery-metric-pill">
                  <span className="metric-icon">★</span>
                  <span className="metric-num">{reviews.length}</span>
                  <span className="metric-label">Reviews</span>
                </div>
                <div className="home-discovery-metric-pill">
                  <span className="metric-icon">⇄</span>
                  <span className="metric-num">{comparisons.length}</span>
                  <span className="metric-label">Comparisons</span>
                </div>
                <div className="home-discovery-metric-pill">
                  <span className="metric-icon">✍️</span>
                  <span className="metric-num">{blogs.length}</span>
                  <span className="metric-label">Guides</span>
                </div>
              </div>
            </div>

            {/* PRIMARY NAVIGATION BAR BUTTONS */}
            <nav className="home-discovery-nav-bar" aria-label="SaaS Hub Quick Jump">
              <a href="#comparisons" className="home-discovery-nav-item primary-jump">
                <span className="nav-item-icon">⇄</span>
                <span className="nav-item-text">Compare SaaS</span>
                <span className="nav-item-hint">Explore</span>
              </a>

              <a href="#deals" className="home-discovery-nav-item">
                <span className="nav-item-icon">⚡</span>
                <span className="nav-item-text">Active Deals</span>
                <span className="nav-item-badge">Save $</span>
              </a>

              <Link href="/reviews" className="home-discovery-nav-item">
                <span className="nav-item-icon">★</span>
                <span className="nav-item-text">All Reviews</span>
              </Link>

              <a href="#categories" className="home-discovery-nav-item">
                <span className="nav-item-icon">✦</span>
                <span className="nav-item-text">Categories</span>
              </a>

              <a href="#blogs" className="home-discovery-nav-item">
                <span className="nav-item-icon">📚</span>
                <span className="nav-item-text">SaaS Guides</span>
              </a>

              <Link href="/search" className="home-discovery-nav-item search-pill">
                <span className="nav-item-icon">🔍</span>
                <span className="nav-item-text">Search Software</span>
              </Link>

              <Link href="/submit-deal" className="home-discovery-nav-item submit-pill">
                <span className="nav-item-sparkle">✨</span>
                <span className="nav-item-text">Submit SaaS</span>
                <span className="nav-item-arrow">→</span>
              </Link>
            </nav>

            {/* TRENDING CATEGORY CHIPS */}
            <div className="home-discovery-chips-row">
              <span className="home-discovery-chips-label">
                <span className="chips-icon">⚡</span>
                <span>Trending Categories:</span>
              </span>
              <div className="home-discovery-chips-list">
                {categories && categories.length > 0 ? (
                  categories.slice(0, 7).map((cat) => (
                    <Link
                      key={cat._id || cat.slug}
                      href={`/deals?category=${encodeURIComponent(cat.slug || cat.name?.toLowerCase())}`}
                      className="home-discovery-chip"
                    >
                      <span className="chip-hash">#</span>
                      <span className="chip-name">{cat.name}</span>
                    </Link>
                  ))
                ) : (
                  <>
                    <Link href="/deals?category=ai-tools" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">AI Tools</span>
                    </Link>
                    <Link href="/deals?category=productivity" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">Productivity</span>
                    </Link>
                    <Link href="/deals?category=seo-marketing" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">SEO &amp; Marketing</span>
                    </Link>
                    <Link href="/deals?category=sales-crm" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">Sales &amp; CRM</span>
                    </Link>
                    <Link href="/deals?category=video-design" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">Video &amp; Design</span>
                    </Link>
                    <Link href="/deals?category=development" className="home-discovery-chip">
                      <span className="chip-hash">#</span>
                      <span className="chip-name">Development</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhySaaSpin />
      <Footer />
    </>
  );
}
