import "@/app/public-pages.css";
import "./deal-detail.css";
import { pageMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { categories, canonicalSlug } from "@/lib/categories";
import Navbar from "../../../components/Navbar";
import OfferTiming, { DealOfferButton } from "@/components/OfferTiming";
import { getOfferTime } from "@/lib/dealDates";
import Footer from "../../../components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

function isMongoId(value) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

async function getDeal(id) {
  const response = await fetch(`${API_URL}/deals/${id}`, {
    cache: "no-store",
      signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Failed to fetch deal");

  const deal = await response.json();
  if (!deal?.product) notFound();
  return deal;
}

function redirectCategory(slug) {
  const category = canonicalSlug(slug);
  if (!categories.some((item) => item.slug === category)) notFound();
  permanentRedirect(`/deals?category=${encodeURIComponent(category)}`);
}
async function getProductReview(productId) {
  try {
    const response = await fetch(`${API_URL}/reviews`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const reviews = await response.json();

    return reviews.find((review) => review.product?._id === productId) || null;
  } catch {
    return null;
  }
}
async function getRelatedDeals(categorySlug, currentDealId) {
  if (!categorySlug) return [];

  try {
    const response = await fetch(
      `${API_URL}/deals/category/${encodeURIComponent(categorySlug)}`,
      {
        cache: "no-store",
      signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return [];
    }

    const deals = await response.json();

    return deals
      .filter((relatedDeal) => relatedDeal._id !== currentDealId)
      .slice(0, 3);
  } catch {
    return [];
  }
}
export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Non-MongoDB slugs are category URLs handled by the page redirect.
  if (!isMongoId(slug)) {
    redirectCategory(slug);
  }

  const deal = await getDeal(slug);

  const product = deal.product;

  const description = `View the ${product.name} deal, listed pricing and offer schedule. Explore product information and confirm current terms with the provider.`;

  return pageMetadata({
    title: `${product.name} Deal`,
    description,
    path: `/deals/${encodeURIComponent(deal._id)}`,
    image: product.logo || undefined,
  });
}

export default async function DealPage({ params }) {
  const { slug } = await params;

  // =====================================
  // INDIVIDUAL DEAL PAGE
  // =====================================

  if (isMongoId(slug)) {
    const deal = await getDeal(slug);

    const offerNow = await getOfferTime();
    const product = deal.product;
    const review = await getProductReview(product._id);
    const relatedDeals = await getRelatedDeals(
      product.category?.slug,
      deal._id,
    );
    return (
      <>
        <Navbar />

        <main className="deal-detail-page public-page">
          <div className="deal-detail-container">
            <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Deals", path: "/deals" }, ...(product.category?.name && product.category?.slug ? [{ name: product.category.name, path: `/deals?category=${encodeURIComponent(canonicalSlug(product.category.slug))}` }] : []), { name: `${product.name} Deal`, path: `/deals/${encodeURIComponent(deal._id)}` }]} />
            <div className="deal-detail-card">
              <div className="deal-detail-header">
                <div className="deal-logo">
                  {product.logo ? (
                    <img src={product.logo} alt={`${product.name} logo`} />
                  ) : (
                    product.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="deal-detail-intro">
                  <span className="deal-category">
                    {product.category?.slug ? <Link href={`/deals?category=${encodeURIComponent(canonicalSlug(product.category.slug))}`}>{product.category.name}</Link> : "Software"}
                  </span>

                  <h1>{product.name} Deal</h1>

                  <p>{product.shortDescription || product.description}</p>
                </div>
              </div>

            </div>
            <div className="deal-detail-layout">
            <aside className="deal-summary-card" aria-label="Deal summary">
              <div className="deal-summary-brand">
                <div className="product-offer-logo">
                  {product.logo ? (
                    <img src={product.logo} alt={`${product.name} logo`} />
                  ) : product.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="deal-section-label">DEAL SUMMARY</span>
                  <h2>{product.name}</h2>
                </div>
              </div>
              <div className="deal-detail-offer">
                <div>
                  <span className="deal-offer-label">OFFER SCHEDULE</span>
                  <OfferTiming deal={deal} initialNow={offerNow} />

                  <div className="deal-detail-pricing">
                    <span className="deal-discount">{deal.discount}</span>

                    <div className="deal-price">
                      <strong>${deal.price}</strong>
                      {deal.oldPrice && <del>${deal.oldPrice}</del>}
                    </div>
                  </div>
                </div>

                <span className="deal-type-badge">{deal.dealType}</span>
              </div>

              <div className="deal-information">
                <div>
                  <span>Deal Type</span>
                  <strong>{deal.dealType}</strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>{product.category?.name || "Software"}</strong>
                </div>
              </div>

              <div className="deal-detail-actions">
                <DealOfferButton deal={deal} initialNow={offerNow}
                  product={deal.product}
                  dealUrl={deal.dealUrl}
                  source="deal"
                  label="Get This Deal"
                />
              </div>
            </aside>
            <div className="deal-detail-main">
                  {review && (
                    <div className="deal-review-link">
                      <div>
                        <span>WANT TO KNOW MORE?</span>

                        <p>
                          Read our in-depth {product.name} review before choosing this
                          deal.
                        </p>
                      </div>

                      <Link
                        href={`/reviews/${review.slug}`}
                        className="deal-review-link-button"
                      >
                        Read Review →
                      </Link>
                    </div>
                  )}
                <section className="product-offers-section">
                  <div className="deal-section-heading">
                    <span className="deal-section-label">OFFER DETAILS</span>

                    <h2>{product.name} Deals & Offers</h2>

                    <p>
                      Review the offer schedule and pricing below and confirm the final pricing and
                      terms on the provider&apos;s website.
                    </p>
                  </div>

                  <article className="product-offer-card">
                    <div className="product-offer-top">
                      <div className="product-offer-brand">
                        <div className="product-offer-logo">
                          {product.logo ? (
                            <img src={product.logo} alt={`${product.name} logo`} />
                          ) : (
                            product.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <span>FEATURED OFFER</span>
                          <h3>{product.name}</h3>
                        </div>
                      </div>

                      <span className="product-offer-badge">{deal.dealType}</span>
                    </div>

                    <div className="product-offer-content">
                      <span className="product-offer-discount">{deal.discount}</span>

                      <h3>{product.name} Deal</h3>

                      <div className="product-offer-pricing">
                        <div>
                          <span>Deal Price</span>
                          <strong>${deal.price}</strong>
                        </div>

                        {deal.oldPrice && (
                          <div>
                            <span>Listed Price</span>
                            <del>${deal.oldPrice}</del>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="product-offer-action">
                      <DealOfferButton deal={deal} initialNow={offerNow}
                        product={deal.product}
                        dealUrl={deal.dealUrl}
                        source="deal"
                        label="Activate Deal"
                      />
                    </div>
                  </article>
                </section>
                {(product.strengths?.length > 0 ||
                  product.limitations?.length > 0) && (
                  <section className="product-pros-cons-section">
                    <div className="deal-section-heading">
                      <span className="deal-section-label">PRODUCT ANALYSIS</span>

                      <h2>{product.name} — Pros & Cons</h2>
                    </div>

                    <div className="product-pros-cons-grid">
                      {product.strengths?.length > 0 && <div className="product-pros-card">
                        <div className="product-analysis-title">
                          <span>✓</span>
                          <h3>Pros</h3>
                        </div>

                        <ul>
                          {product.strengths?.map((strength, index) => (
                            <li key={index}>
                              <span>✓</span>
                              <p>{strength}</p>
                            </li>
                          ))}
                        </ul>
                      </div>}

                      {product.limitations?.length > 0 && <div className="product-cons-card">
                        <div className="product-analysis-title">
                          <span>−</span>
                          <h3>Cons</h3>
                        </div>

                        <ul>
                          {product.limitations?.map((limitation, index) => (
                            <li key={index}>
                              <span>−</span>
                              <p>{limitation}</p>
                            </li>
                          ))}
                        </ul>
                      </div>}
                    </div>
                  </section>
                )}
                {review && (
                  <section className="deal-expert-review">
                    <div className="deal-expert-score">
                      <span>EXPERT REVIEW</span>

                      <strong>{review.overallRating}</strong>

                      <small>Expert Score</small>
                    </div>

                    <div className="deal-expert-content">
                      <span className="deal-section-label">EXPERT VERDICT</span>

                      <h2>Our {product.name} Review</h2>

                      <p className="deal-expert-verdict">{review.quickVerdict}</p>

                      {review.excerpt && <p>{review.excerpt}</p>}

                      <div className="deal-expert-meta">
                        {review.author && <span>By {review.author}</span>}

                        {review.readTime && <span>{review.readTime} min read</span>}
                      </div>

                      <Link
                        href={`/reviews/${review.slug}`}
                        className="deal-expert-button"
                      >
                        Read Full {product.name} Review →
                      </Link>
                    </div>
                  </section>
                )}
                <section className="deal-guide-section">
                  <div className="deal-section-heading">
                    <span className="deal-section-label">IN-DEPTH GUIDE</span>

                    <h2>{product.name} Overview & Capabilities</h2>

                    <p>
                      A closer look at {product.name}, its capabilities, strengths and
                      who it may be useful for.
                    </p>
                  </div>

                  <div className="deal-guide-content">
                    <div className="deal-guide-main">
                      <h3>About {product.name}</h3>

                      <p>{product.description}</p>

                      {product.features?.length > 0 && (
                        <div className="deal-guide-block">
                          <h3>What It Does Best</h3>

                          <ul className="deal-feature-list">
                            {product.features.map((feature, index) => (
                              <li key={index}>
                                <span>✓</span>
                                <p>{feature}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {product.targetAudience?.length > 0 && (
                        <div className="deal-guide-block">
                          <h3>Who Is {product.name} For?</h3>

                          <ul className="deal-feature-list">
                            {product.targetAudience.map((audience, index) => (
                              <li key={index}>
                                <span>→</span>
                                <p>{audience}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {product.integrations?.length > 0 && (
                        <div className="deal-guide-block">
                          <h3>Integrations</h3>

                          <div className="deal-integration-list">
                            {product.integrations.map((integration, index) => (
                              <span key={index}>{integration}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <section className="deal-guide-sidebar">
                      <span className="deal-section-label">HOW TO CLAIM</span>

                      <h3>Ready to try {product.name}?</h3>

                      <p>
                        Use the button below to open the offer on the provider&apos;s
                        website. Confirm the final price, eligibility and terms before
                        completing your purchase.
                      </p>

                      {product.pricingInfo && <div className="deal-guide-block">
                        <h3>Pricing information</h3>
                        <p>{product.pricingInfo}</p>
                      </div>}

                      <div className="deal-guide-price">
                        <span>Current deal</span>

                        <strong>${deal.price}</strong>

                        {deal.oldPrice && <del>${deal.oldPrice}</del>}
                      </div>

                      <DealOfferButton deal={deal} initialNow={offerNow}
                        product={deal.product}
                        dealUrl={deal.dealUrl}
                        source="deal"
                        label={`Get ${product.name} Deal`}
                      />
                    </section>
                  </div>
                </section>
                <section className="deal-detail-faq">
                  <div className="deal-section-heading">
                    <span className="deal-section-label">SUPPORT</span>

                    <h2>Frequently Asked Questions</h2>

                    <p>
                      Common questions about {product.name} and the current SaaSpin
                      deal.
                    </p>
                  </div>

                  <div className="deal-faq-list">
                    <details className="deal-faq-item">
                      <summary>
                        What is {product.name} used for?
                        <span>+</span>
                      </summary>

                      <p>{product.shortDescription || product.description}</p>
                    </details>

                    <details className="deal-faq-item">
                      <summary>
                        What is the current {product.name} deal?
                        <span>+</span>
                      </summary>

                      <p>
                        SaaSpin lists this offer at ${deal.price}
                        {deal.oldPrice
                          ? ` compared with the listed price of $${deal.oldPrice}.`
                          : "."}{" "}
                        Check the provider&apos;s website for current pricing and
                        eligibility.
                      </p>
                    </details>

                    <details className="deal-faq-item">
                      <summary>
                        What type of deal is this?
                        <span>+</span>
                      </summary>

                      <p>
                        This offer is categorized on SaaSpin as a{" "}
                        <strong>{deal.dealType}</strong> deal. Billing terms and
                        eligibility are determined by the software provider.
                      </p>
                    </details>

                    <details className="deal-faq-item">
                      <summary>
                        Can the price change?
                        <span>+</span>
                      </summary>

                      <p>
                        Yes. Software providers can change prices, discounts and offer
                        terms. Confirm the final price on the provider&apos;s website
                        before purchasing.
                      </p>
                    </details>

                    <details className="deal-faq-item">
                      <summary>
                        Does SaaSpin use affiliate links?
                        <span>+</span>
                      </summary>

                      <p>
                        Some links may be affiliate links. SaaSpin may earn a
                        commission from an eligible purchase at no additional cost to
                        you.
                      </p>
                    </details>
                  </div>
                </section>
            </div>

            </div>
          {relatedDeals.length > 0 && (
            <section className="related-deals-section">
              <div className="deal-section-heading">
                <span className="deal-section-label">DISCOVER MORE</span>

                <h2>More {product.category?.name || "Software"} Deals</h2>

                <p>Explore other SaaS tools and offers in the same category.</p>
              </div>

              <div className="related-deals-grid">
                {relatedDeals.map((relatedDeal) => {
                  const relatedProduct = relatedDeal.product;

                  if (!relatedProduct) return null;

                  return (
                    <article
                      key={relatedDeal._id}
                      className="related-deal-card"
                    >
                      <div className="related-deal-logo">
                        {relatedProduct.logo ? (
                          <img
                            src={relatedProduct.logo}
                            alt={`${relatedProduct.name} logo`}
                          />
                        ) : (
                          relatedProduct.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <span className="related-deal-category">
                        {relatedProduct.category?.name || "Software"}
                      </span>

                      <h3>{relatedProduct.name}</h3>

                      <p>
                        {relatedProduct.shortDescription ||
                          relatedProduct.description}
                      </p>

                      <div className="related-deal-offer">
                        <OfferTiming deal={relatedDeal} initialNow={offerNow} />
                        <div>
                          <span>{relatedDeal.discount}</span>

                          <strong>${relatedDeal.price}</strong>
                        </div>

                        {relatedDeal.oldPrice && (
                          <del>${relatedDeal.oldPrice}</del>
                        )}
                      </div>

                      <Link
                        href={`/deals/${relatedDeal._id}`}
                        className="related-deal-link"
                      >
                        View Deal →
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  redirectCategory(slug);
}
