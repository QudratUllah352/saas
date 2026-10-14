import "@/app/public-pages.css";
import "./review-detail.css";
import { pageMetadata, unavailableMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/api";
import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { notFound } from "next/navigation";
import OfferTiming, { DealOfferButton } from "@/components/OfferTiming";
import { getOfferTime } from "@/lib/dealDates";
import Footer from "../../../components/Footer";
import ReviewShare from "../../../components/ReviewShare";

function hasRating(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5;
}

async function getReview(slug) {
  const response = await fetch(`${API_URL}/reviews/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch review");
  }

  return response.json();
}
async function getRelatedReviews(currentReview) {
  try {
    const response = await fetch(`${API_URL}/reviews`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const reviews = await response.json();

    const currentCategory =
      currentReview.product?.category?.slug;

    return reviews
      .filter((item) => {
        if (item._id === currentReview._id) {
          return false;
        }

        if (!currentCategory) {
          return true;
        }

        return (
          item.product?.category?.slug ===
          currentCategory
        );
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}
async function getRelatedBlogs(productId) {
  if (!productId) return [];

  try {
    const response = await fetch(`${API_URL}/blogs`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const blogs = await response.json();

    return blogs
      .filter((blog) =>
        blog.relatedProducts?.some(
          (relatedProduct) =>
            relatedProduct._id === productId
        )
      )
      .slice(0, 2);
  } catch {
    return [];
  }
}
async function getRelatedComparisons(productId) {
  if (!productId) return [];

  try {
    const response = await fetch(
      `${API_URL}/comparisons`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const comparisons = await response.json();

    return comparisons
      .filter((comparison) => {
        const productAId =
          comparison.productA?._id;

        const productBId =
          comparison.productB?._id;

        return (
          productAId === productId ||
          productBId === productId
        );
      })
      .slice(0, 2);
  } catch {
    return [];
  }
}
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const review = await getReview(slug);

  if (!review) {
    return unavailableMetadata("Review not found");
  }

  const productName = review.product?.name || "Software";

  const title = review.title || `${productName} Review`;

  const description =
    review.excerpt ||
    review.quickVerdict ||
    `Read our ${productName} review covering features, pricing, strengths, limitations, and alternatives.`;

  return pageMetadata({
    title,
    description,
    path: `/reviews/${encodeURIComponent(review.slug)}`,
    image: review.product?.logo || undefined,
    type: "article",
  });
}

export default async function ReviewDetailPage({ params }) {
  const { slug } = await params;

  const review = await getReview(slug);

  if (!review) {
    notFound();
  }

  const product = review.product;
  const deal = review.deal;
  const hasOverallRating = hasRating(review.overallRating);
  const hasRatingBreakdown = Object.values(review.ratingBreakdown || {}).some(hasRating);
  const hasProsCons = review.pros?.length > 0 || review.cons?.length > 0;
  const offerNow = await getOfferTime();
  const relatedReviews =
    await getRelatedReviews(review);
  const relatedBlogs =
    await getRelatedBlogs(product?._id);
  const relatedComparisons =
    await getRelatedComparisons(product?._id);
  return (
    <>
      <Navbar />

      <main className="review-detail-page public-page">
        <div className="review-detail-container">
        {/* HERO */}

        <section className="review-detail-hero">

            <div className="review-detail-heading">
              <div>
                <div className="review-back-link">

                  <Link href="/reviews">
                    ← Back to all reviews
                  </Link>

                </div>
                {product && <div className="review-hero-brand">
                  <div className="review-product-logo">
                    {product.logo ? <img src={product.logo} alt={`${product.name} logo`} /> : product.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {product.category?.name && <span className="review-category-label">{product.category.name}</span>}
                    <span className="review-product-name">{product.name}</span>
                  </div>
                </div>}
                <h1>{review.title || `${product?.name || "Software"} Review`}</h1>

                {review.excerpt && <p className="review-intro">{review.excerpt}</p>}

                {(review.author || review.publishedAt || review.readTime) && (
                <div className="review-author-meta">

                  {review.author && (
                    <span>By {review.author}</span>
                  )}

                  {review.publishedAt && (
                    <>
                      <time dateTime={review.publishedAt}>
                        {new Date(
                          review.publishedAt
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>
                    </>
                  )}

                  {review.readTime && (
                    <>
                      <span>{review.readTime} min read</span>
                    </>
                  )}

                </div>
                )}
              </div>

              {hasOverallRating && <div className="review-main-score">
                <strong>{review.overallRating}</strong>

                <span>/5</span>

                <small>Overall Rating</small>
              </div>}
            </div>
        </section>

        <div className="review-detail-layout">
          <aside className="review-sidebar" aria-label="Product summary and review navigation">
            {product && <section className="review-product-summary">
              <div className="review-summary-brand">
                <div className="review-product-logo">
                  {product.logo ? <img src={product.logo} alt={`${product.name} logo`} /> : product.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="review-section-label">PRODUCT AT A GLANCE</span>
                  <h2>{product.name}</h2>
                </div>
              </div>
              {(product.shortDescription || product.description) && <p>{product.shortDescription || product.description}</p>}
              {hasOverallRating && <div className="review-summary-rating"><strong>{review.overallRating}/5</strong><span>Editorial rating</span></div>}
              {deal && <div className="review-summary-offer">
                <span className="review-section-label">LISTED OFFER</span>
                <strong>{deal.discount}</strong>
                <OfferTiming deal={deal} initialNow={offerNow} />
              </div>}
              <div className="review-affiliate-section">
                <div className="review-affiliate-content">
                  <span className="review-affiliate-label">INTERESTED IN THIS SOFTWARE?</span>
                  <h3>Explore {product.name}</h3>
                  <p>Visit the official website to learn more about pricing, features and current offers.</p>
                </div>
                <DealOfferButton deal={deal || { isActive: true }} initialNow={offerNow}
                  product={product}
                  dealUrl={deal?.dealUrl || ""}
                  source="review"
                  label={deal ? `Get ${product.name || "Software"} Deal →` : `Visit ${product.name || "Software"} Website →`}
                  className="review-deal-button"
                />
              </div>
            </section>}
            {(review.introduction || review.overview || review.features?.length > 0 || review.pricingPlans?.length > 0 || hasProsCons || review.verdict || hasOverallRating || (deal && deal.isActive)) && (
            <nav className="review-on-page" aria-label="On this page">
              <span>ON THIS PAGE</span>
              <div className="review-on-page-links">
                {review.introduction && <a href="#review">Review</a>}
                {review.overview && <a href="#overview">What is {product?.name}?</a>}
                {review.features?.length > 0 && <a href="#features">Key Features</a>}
                {review.pricingPlans?.length > 0 && <a href="#pricing">Pricing</a>}
                {hasProsCons && <a href="#pros-cons">Pros &amp; Cons</a>}
                {(review.verdict || hasOverallRating || (deal && deal.isActive)) && <a href="#verdict">Final Verdict</a>}
              </div>
            </nav>)}
          </aside>
          <article className="review-article">
          {/* INTRODUCTION */}

          {review.introduction && <section
            id="review"
            className="review-content-section"
          >
            <p className="review-large-text">{review.introduction}</p>
          </section>}

          {/* QUICK VERDICT */}

          {(review.quickVerdict || review.topPros?.length > 0 || review.biggestLimitation) && <section className="quick-verdict-box">
            <span className="review-section-label">QUICK VERDICT</span>

            <h2>Our Take on {product?.name}</h2>

            {review.quickVerdict && <p>{review.quickVerdict}</p>}

            {review.topPros?.length > 0 && (
              <div className="quick-pros">
                {review.topPros.map((item, index) => (
                  <span key={index}>✓ {item}</span>
                ))}
              </div>
            )}
            {review.biggestLimitation && (
              <div className="quick-limitation">
                <strong>Biggest limitation:</strong> {review.biggestLimitation}
              </div>
            )}
          </section>}
          {/* RATING BREAKDOWN */}
          <ReviewShare
            title={review.title}
            slug={review.slug}
          />
          {/* RATING SUMMARY */}

          {(hasOverallRating || hasRatingBreakdown) && <section className="review-rating-summary">

            <div className="review-rating-heading">
              <span className="review-section-label">
                RATING SUMMARY
              </span>

              <h2>
                Rating summary for {product?.name}
              </h2>
            </div>

            <div className="review-rating-layout">

              {hasOverallRating && <div className="review-rating-overall">

                <div className="review-rating-number">
                  <strong>{review.overallRating}</strong>
                  <span>/5</span>
                </div>

                <p>
                  {Number(review.overallRating) >= 4.5
                    ? "Excellent"
                    : Number(review.overallRating) >= 4
                      ? "Good"
                      : Number(review.overallRating) >= 3
                        ? "Average"
                        : "Below Average"}
                </p>

                <small>
                  SaaSpin editorial score
                </small>

              </div>}

              {hasRatingBreakdown && <div className="rating-breakdown-grid">

                <RatingBox
                  label="Feature Depth"
                  value={review.ratingBreakdown?.features}
                />

                <RatingBox
                  label="Ease of Use"
                  value={review.ratingBreakdown?.easeOfUse}
                />

                <RatingBox
                  label="Value for Money"
                  value={review.ratingBreakdown?.valueForMoney}
                />

                <RatingBox
                  label="Support & Docs"
                  value={review.ratingBreakdown?.support}
                />

              </div>}

            </div>

          </section>}


          {/* RELATED DEAL */}

          {deal && deal.isActive && (
            <section className="review-deal-box">
              <OfferTiming deal={deal} initialNow={offerNow} />
              <div>
                <span className="review-section-label">CURRENT DEAL</span>

                <h2>
                  Save {deal.discount} on {product?.name}
                </h2>

                <div className="review-deal-price">
                  <strong>${deal.price}</strong>

                  {deal.oldPrice && (
                    <del>${deal.oldPrice}</del>
                  )}
                </div>

                <p>
                  {deal.dealType === "lifetime"
                    ? "Lifetime deal"
                    : `${deal.dealType} deal`}
                </p>
              </div>

              <DealOfferButton deal={deal || { isActive: true }} initialNow={offerNow}
                product={review.product}
                dealUrl={deal.dealUrl}
                source="review"
                label="Get Deal →"
                className="review-deal-button"
              />
            </section>
          )}

          {/* OVERVIEW */}

          {review.overview && <section
            id="overview"
            className="review-content-section"
          >
            <h2>What is {product?.name}?</h2>

            <p>{review.overview}</p>
          </section>}

          {/* TARGET AUDIENCE */}

          {review.targetAudience?.length > 0 && (
            <section className="review-content-section">
              <h2>Who is {product?.name} for?</h2>

              <div className="target-audience-list">
                {review.targetAudience.map((audience, index) => (
                  <span key={index}>{audience}</span>
                ))}
              </div>
            </section>
          )}

          {/* FEATURES */}

          {review.features?.length > 0 && (
            <section
              id="features"
              className="review-content-section"
            >
              <h2>Key Features</h2>

              <div className="review-features-list">
                {review.features.map((feature, index) => (
                  <article key={index} className="review-feature">
                    <span>{String(index + 1).padStart(2, "0")}</span>

                    <div>
                      <h3>{feature.title}</h3>

                      <p>{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* PRICING */}

          {review.pricingPlans?.length > 0 && (
            <section
              id="pricing"
              className="review-content-section"
            >
              <h2>{product?.name} Pricing</h2>

              <div className="review-pricing-grid">
                {review.pricingPlans.map((plan, index) => (
                  <article key={index} className="review-pricing-card">
                    <h3>{plan.name}</h3>

                    <div className="pricing-price">{plan.price}</div>

                    {plan.billing && (
                      <p className="pricing-billing">{plan.billing}</p>
                    )}

                    {plan.description && <p>{plan.description}</p>}

                    {plan.features?.length > 0 && (
                      <ul>
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex}>✓ {feature}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* PROS / CONS */}

          {hasProsCons && <section
            id="pros-cons"
            className="review-content-section"
          >
            <h2>{product?.name} Pros & Cons</h2>

            <div className="review-pros-cons">
              {review.pros?.length > 0 && <div className="review-pros">
                <h3>Pros</h3>

                <ul>
                {review.pros?.map((pro, index) => (
                  <li key={index}><span aria-hidden="true">✓</span><span>{pro}</span></li>
                ))}
                </ul>
              </div>}

              {review.cons?.length > 0 && <div className="review-cons">
                <h3>Cons</h3>

                <ul>
                {review.cons?.map((con, index) => (
                  <li key={index}><span aria-hidden="true">−</span><span>{con}</span></li>
                ))}
                </ul>
              </div>}
            </div>
          </section>}

          {/* ALTERNATIVES */}

          {review.alternatives?.length > 0 && (
            <section className="review-content-section">
              <h2>Alternatives to {product?.name}</h2>

              <div className="review-alternatives">
                {review.alternatives.map((alternative) => (
                  <article key={alternative._id} className="alternative-card">
                    <div className="alternative-logo">
                      {alternative.logo ? (
                        <img src={alternative.logo} alt={alternative.name} />
                      ) : (
                        alternative.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>

                    <h3>{alternative.name}</h3>

                    <p>{alternative.description}</p>

                    <span>{alternative.category?.name}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* FINAL VERDICT */}

          {(review.verdict || hasOverallRating || (deal && deal.isActive)) && <section
            id="verdict"
            className="review-final-verdict"
          >
            <span className="review-section-label">
              EXPERT VERDICT
            </span>

            <div className="review-expert-heading">

              <div>
                <h2>
                  Our Take on {product?.name}
                </h2>

                <p className="review-expert-subtitle">
                  Our overall assessment based on the
                  review criteria below.
                </p>
              </div>

              {hasOverallRating && <div className="review-expert-score">

                <div>
                  <strong>{review.overallRating}</strong>
                  <span>/5</span>
                </div>

                <small>Expert Score</small>

              </div>}

            </div>

            {review.verdict && <p>{review.verdict}</p>}

            {hasOverallRating && <div className="final-score">{review.overallRating}/5</div>}

            {deal && deal.isActive && (
              <DealOfferButton deal={deal || { isActive: true }} initialNow={offerNow}
                product={product}
                dealUrl={deal.dealUrl}
                source="review"
                label={`Get ${product?.name || "Software"} Deal →`}
                className="review-deal-button"
              />
            )}
          </section>}
          </article>
        </div>
          {/* RELATED CONTENT */}

          {(relatedReviews.length > 0 ||
            relatedBlogs.length > 0 ||
            relatedComparisons.length > 0) && (
              <section className="review-related-content">

                <div className="review-related-heading">
                  <span className="review-section-label">
                    RELATED CONTENT
                  </span>

                  <h2>Continue Exploring</h2>

                  <p>
                    Discover more SaaSpin reviews for
                    similar software.
                  </p>
                </div>

                <div className="review-related-grid">

                  {relatedReviews.map((item) => {
                    const relatedProduct = item.product;

                    return (
                      <article
                        key={item._id}
                        className="review-related-card"
                      >

                        <div className="review-related-card-top">

                          <span className="review-related-type">
                            REVIEW
                          </span>

                          {relatedProduct?.category?.name && (
                            <span className="review-related-category">
                              {relatedProduct.category.name}
                            </span>
                          )}

                        </div>

                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {item.excerpt ||
                            item.quickVerdict}
                        </p>

                        <div className="review-related-meta">

                          {item.overallRating && (
                            <span>
                              ★ {item.overallRating}/5
                            </span>
                          )}

                          {item.readTime && (
                            <span>
                              {item.readTime} min read
                            </span>
                          )}

                        </div>

                        <Link
                          href={`/reviews/${item.slug}`}
                          className="review-related-link"
                        >
                          Read Review →
                        </Link>

                      </article>
                    );
                  })}
                  {relatedBlogs.map((blog) => (
                    <article
                      key={blog._id}
                      className="review-related-card"
                    >

                      <div className="review-related-card-top">

                        <span className="review-related-type">
                          BLOG
                        </span>

                        {blog.category && (
                          <span className="review-related-category">
                            {blog.category}
                          </span>
                        )}

                      </div>

                      <h3>
                        {blog.title}
                      </h3>

                      <p>
                        {blog.excerpt}
                      </p>

                      <div className="review-related-meta">

                        {blog.author && (
                          <span>
                            By {blog.author}
                          </span>
                        )}

                        {blog.readTime && (
                          <span>
                            {blog.readTime} min read
                          </span>
                        )}

                      </div>

                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="review-related-link"
                      >
                        Read Article →
                      </Link>

                    </article>
                  ))}
                  {relatedComparisons.map((comparison) => (
                    <article
                      key={comparison._id}
                      className="review-related-card"
                    >

                      <div className="review-related-card-top">

                        <span className="review-related-type">
                          COMPARISON
                        </span>

                        <span className="review-related-category">
                          VS
                        </span>

                      </div>

                      <h3>
                        {comparison.title}
                      </h3>

                      <p>
                        {comparison.excerpt}
                      </p>

                      <div className="review-comparison-products">

                        <span>
                          {comparison.productA?.name}
                        </span>

                        <strong>vs</strong>

                        <span>
                          {comparison.productB?.name}
                        </span>

                      </div>

                      <div className="review-related-meta">

                        {comparison.author && (
                          <span>
                            By {comparison.author}
                          </span>
                        )}

                        {comparison.readTime && (
                          <span>
                            {comparison.readTime} min read
                          </span>
                        )}

                      </div>

                      <Link
                        href={`/comparisons/${comparison.slug}`}
                        className="review-related-link"
                      >
                        View Comparison →
                      </Link>

                    </article>
                  ))}
                </div>

              </section>
            )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function RatingBox({ label, value }) {
  if (!hasRating(value)) return null;
  const safeValue = value;

  return (
    <div className="rating-breakdown-card">

      <div className="rating-breakdown-top">
        <span>{label}</span>
        <strong>{safeValue.toFixed(1)}</strong>
      </div>

      <div className="rating-track">
        <div
          className="rating-fill"
          style={{
            width: `${(safeValue / 5) * 100}%`,
          }}
        />
      </div>

    </div>
  );
}
