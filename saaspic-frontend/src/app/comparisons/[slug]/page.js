import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import "./comparison-detail.css";
import { getSiteUrl, pageMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import AffiliateButton from "../../../components/AffiliateButton";
import Footer from "../../../components/Footer";
import ComparisonShare from "../../../components/ComparisonShare";

async function getComparison(slug) {
  const response = await fetch(
    `${API_URL}/comparisons/${slug}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    }
  );

  if (response.status === 404) notFound();

  if (!response.ok) {
    throw new Error(
      "Failed to load comparison."
    );
  }

  const comparison = await response.json();
  if (!comparison?.productA || !comparison?.productB) notFound();
  return comparison;
}
async function getRelatedReviews(productAId, productBId) {
  try {
    const response = await fetch(
      `${API_URL}/reviews`,
      { cache: "no-store" }
    );

    if (!response.ok) return [];

    const reviews = await response.json();

    return reviews
      .filter((review) => {
        const productId = review.product?._id;

        return (
          productId === productAId ||
          productId === productBId
        );
      })
      .slice(0, 2);
  } catch {
    return [];
  }
}
async function getRelatedBlogs(productAId, productBId) {
  try {
    const response = await fetch(
      `${API_URL}/blogs`,
      { cache: "no-store" }
    );

    if (!response.ok) return [];

    const blogs = await response.json();

    return blogs
      .filter((blog) =>
        blog.relatedProducts?.some(
          (product) =>
            product._id === productAId ||
            product._id === productBId
        )
      )
      .slice(0, 2);
  } catch {
    return [];
  }
}
async function getRelatedComparisons(
  productAId,
  productBId,
  currentComparisonId
) {
  try {
    const response = await fetch(
      `${API_URL}/comparisons`,
      { cache: "no-store" }
    );

    if (!response.ok) return [];

    const comparisons = await response.json();

    return comparisons
      .filter((item) => {
        if (item._id === currentComparisonId) {
          return false;
        }

        const itemA = item.productA?._id;
        const itemB = item.productB?._id;

        return (
          itemA === productAId ||
          itemA === productBId ||
          itemB === productAId ||
          itemB === productBId
        );
      })
      .slice(0, 2);
  } catch {
    return [];
  }
}
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const comparison = await getComparison(slug);

  const productAName =
    comparison.productA?.name || "Software A";

  const productBName =
    comparison.productB?.name || "Software B";

  const title =
    comparison.title ||
    `${productAName} vs ${productBName}`;

  const description =
    comparison.excerpt ||
    `Compare ${productAName} and ${productBName}, including features, strengths, limitations, pricing, and ideal use cases.`;

  return pageMetadata({
    title,
    description,
    path: `/comparisons/${encodeURIComponent(
      comparison.slug
    )}`,
    image:
      comparison.productA?.logo ||
      comparison.productB?.logo ||
      undefined,
    type: "article",
  });
}

export default async function ComparisonPage({
  params,
}) {
  const { slug } = await params;

  const comparison =
    await getComparison(slug);

  if (!comparison) {
    notFound();
  }

  const productA =
    comparison.productA;

  const productB =
    comparison.productB;
  const hasQuickVerdict = comparison.excerpt || comparison.productABestFor?.length > 0 || comparison.productBBestFor?.length > 0;
  const hasProductADeepDive = productA?.description || productA?.shortDescription || comparison.productABestFor?.length > 0 || comparison.productAStrengths?.length > 0 || comparison.productALimitations?.length > 0;
  const hasProductBDeepDive = productB?.description || productB?.shortDescription || comparison.productBBestFor?.length > 0 || comparison.productBStrengths?.length > 0 || comparison.productBLimitations?.length > 0;
  const hasDeepDives = hasProductADeepDive || hasProductBDeepDive;
  const hasPricing = productA?.pricingInfo || productB?.pricingInfo;
  const comparisonPoints = (comparison.comparisonPoints || []).filter(point => point && (point.title || point.productA || point.productB));
  const hasListedPricing = comparisonPoints.some(point => /price|pricing|deal|offer|discount/i.test(point.title || ""));
  const [
    relatedReviews,
    relatedBlogs,
    relatedComparisons,
  ] = await Promise.all([
    getRelatedReviews(
      productA?._id,
      productB?._id
    ),

    getRelatedBlogs(
      productA?._id,
      productB?._id
    ),

    getRelatedComparisons(
      productA?._id,
      productB?._id,
      comparison._id
    ),
  ]);
  return (
    <>
      <Navbar />

      <main className="comparison-detail-page public-page">

        <div className="comparison-detail-container">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Comparisons", path: "/comparisons" }, { name: comparison.title || `${productA?.name || "Software A"} vs ${productB?.name || "Software B"}`, path: `/comparisons/${encodeURIComponent(comparison.slug)}` }]} />

          {/* HEADER */}

          <section className="comparison-detail-hero">

            <span className="comparison-detail-label">
              HEAD-TO-HEAD
            </span>

            <h1>
              {comparison.title || `${productA?.name || "Software A"} vs ${productB?.name || "Software B"}`}
            </h1>

            {comparison.excerpt && <p className="comparison-detail-excerpt">
              {comparison.excerpt}
            </p>}

            {(comparison.author || comparison.publishedAt || comparison.readTime) && (
            <div className="comparison-detail-meta">

              {comparison.author && <span>By {comparison.author}</span>}

              {comparison.publishedAt && (
                <>
                  <time dateTime={comparison.publishedAt}>
                    {new Date(
                      comparison.publishedAt
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </>
              )}

              {comparison.readTime && <span>{comparison.readTime} min read</span>}

            </div>
            )}

          </section>

          {/* PRODUCT CARDS */}

          <section className="comparison-detail-products">

            {productA && <div className="comparison-detail-product">

              <div className="comparison-detail-logo">

                {productA?.logo ? (
                  <img
                    src={productA.logo}
                    alt={productA.name}
                  />
                ) : (
                  productA?.name
                    ?.charAt(0)
                    .toUpperCase()
                )}

              </div>

              <h2>
                {productA?.name}
              </h2>

              {productA?.category?.name && (
                <span className="comparison-product-category">
                  {productA.category.name}
                </span>
              )}

              {(productA.shortDescription || productA.description) && <p>
                {productA?.shortDescription ||
                  productA?.description}
              </p>}

              <AffiliateButton
                product={productA}
                source="comparison"
                label={`Explore ${productA?.name}`}
                className="comparison-product-link"
              />

            </div>}

            {productA && productB && <div className="comparison-detail-vs" aria-label="versus">
              VS
            </div>}

            {productB && <div className="comparison-detail-product">

              <div className="comparison-detail-logo">

                {productB?.logo ? (
                  <img
                    src={productB.logo}
                    alt={productB.name}
                  />
                ) : (
                  productB?.name
                    ?.charAt(0)
                    .toUpperCase()
                )}

              </div>
              <h2>
                {productB?.name}
              </h2>

              {productB?.category?.name && (
                <span className="comparison-product-category">
                  {productB.category.name}
                </span>
              )}

              {(productB.shortDescription || productB.description) && <p>
                {productB?.shortDescription ||
                  productB?.description}
              </p>}

              <AffiliateButton
                product={productB}
                source="comparison"
                label={`Explore ${productB?.name}`}
                className="comparison-product-link"
              />

            </div>}

          </section>
          {/* QUICK VERDICT */}

          {hasQuickVerdict && <section
            className="comparison-quick-verdict"
            id="quick-verdict"
          >
            <span className="comparison-detail-label">
              QUICK VERDICT
            </span>

            <h2>
              {productA?.name} vs {productB?.name}
            </h2>

            {comparison.excerpt && <p>
              {comparison.excerpt}
            </p>}

            {(comparison.productABestFor?.length > 0 || comparison.productBBestFor?.length > 0) && <div className="comparison-verdict-grid">

              {comparison.productABestFor?.length > 0 && <div className="comparison-verdict-card">
                <span>BEST FOR</span>

                <h3>{productA?.name}</h3>

                <ul>
                  {comparison.productABestFor
                    ?.slice(0, 3)
                    .map((item, index) => (
                      <li key={index}>
                        ✓ {item}
                      </li>
                    ))}
                </ul>
              </div>}

              {comparison.productBBestFor?.length > 0 && <div className="comparison-verdict-card">
                <span>BEST FOR</span>

                <h3>{productB?.name}</h3>

                <ul>
                  {comparison.productBBestFor
                    ?.slice(0, 3)
                    .map((item, index) => (
                      <li key={index}>
                        ✓ {item}
                      </li>
                    ))}
                </ul>
              </div>}

            </div>}
          </section>}
          {(hasQuickVerdict || comparison.introduction || comparisonPoints.length > 0 || hasDeepDives || hasPricing || comparison.conclusion) && (
          <nav
            className="comparison-on-page"
            aria-label="On this page"
          >
            <span>ON THIS PAGE</span>

            <div className="comparison-on-page-links">

              {hasQuickVerdict && <a href="#quick-verdict">
                Quick Verdict
              </a>}

              {comparison.introduction && <a href="#overview">
                Overview
              </a>}

              {comparisonPoints.length > 0 && (
                <a href="#quick-comparison">
                  Quick Comparison
                </a>
              )}

              {hasDeepDives && <a href="#deep-dives">
                Deep Dives
              </a>}

              {hasPricing && <a href="#pricing-comparison">Pricing</a>}

              {comparison.conclusion && <a href="#final-verdict">
                Final Verdict
              </a>}

            </div>
          </nav>)}
          {/* OVERVIEW */}

          {comparison.introduction && <section
            className="comparison-content-section comparison-introduction"
            id="overview"
          >

            <span className="comparison-detail-label">
              THE COMPARISON
            </span>

            <h2>
              {productA?.name} vs {productB?.name}
            </h2>

            <p>
              {comparison.introduction}
            </p>

          </section>}

          {/* COMPARISON TABLE */}

          {comparisonPoints.length >
            0 && (

              <section
                className="comparison-content-section"
                id="quick-comparison"
              >

                <span className="comparison-detail-label">
                  AT A GLANCE
                </span>

                <h2>
                  Quick Comparison
                </h2>

                <p className="comparison-section-intro">
                  See how {productA?.name} and{" "}
                  {productB?.name} compare across the
                  most important criteria.
                </p>

                <p className="comparison-table-help" id="comparison-table-help">Scroll the table to compare both products. When focused, use the arrow keys to scroll.</p>
                <div className="comparison-table-wrapper" role="region" aria-label="Side-by-side product comparison" aria-describedby="comparison-table-help" tabIndex={0}>

                  <table className="comparison-table">
                    <caption className="comparison-table-caption">{productA?.name} and {productB?.name}: feature comparison</caption>

                    <thead>

                      <tr>

                        <th scope="col">
                          Comparison
                        </th>

                        <th scope="col">
                          {productA?.name}
                        </th>

                        <th scope="col">
                          {productB?.name}
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {comparisonPoints.map(
                        (point, index) => (

                          <tr key={index}>

                            <th scope="row">
                              {point.title || <span className="comparison-missing-value">Not provided</span>}
                            </th>

                            <td>
                              {point.productA || <span className="comparison-missing-value">Not provided</span>}
                            </td>

                            <td>
                              {point.productB || <span className="comparison-missing-value">Not provided</span>}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {hasListedPricing && <p className="comparison-pricing-note">
                  Listed pricing and offers reflect the published comparison.
                  Confirm current pricing and availability on the provider&apos;s website.
                </p>}

              </section>

            )}

          {/* PRODUCT DEEP DIVES */}

          {hasPricing && <section className="comparison-content-section" id="pricing-comparison">
            <span className="comparison-detail-label">PRICING INFORMATION</span>
            <h2>Pricing at a glance</h2>
            <div className="comparison-pricing-grid">
              {productA?.pricingInfo && <article className="comparison-pricing-card">
                <h3>{productA.name}</h3><p>{productA.pricingInfo}</p>
              </article>}
              {productB?.pricingInfo && <article className="comparison-pricing-card">
                <h3>{productB.name}</h3><p>{productB.pricingInfo}</p>
              </article>}
            </div>
          </section>}

          {hasDeepDives && <section
            className="comparison-content-section"
            id="deep-dives"
          >
            <span className="comparison-detail-label">
              DEEP DIVE
            </span>

            <h2>
              A Closer Look at Both Tools
            </h2>

            <div className="comparison-deep-dive-grid">

              {hasProductADeepDive && <article className="comparison-deep-dive-card">

                <h3>
                  {productA?.name}
                </h3>

                {(productA?.description || productA?.shortDescription) && <p>
                  {productA?.description ||
                    productA?.shortDescription}
                </p>}

                {comparison.productABestFor?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Best For</h4>

                    <ul>
                      {comparison.productABestFor.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {comparison.productAStrengths?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Strengths</h4>

                    <ul className="comparison-positive-list">
                      {comparison.productAStrengths.map(
                        (item, index) => (
                          <li key={index}>
                            ✓ {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {comparison.productALimitations?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Limitations</h4>

                    <ul className="comparison-limit-list">
                      {comparison.productALimitations.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              </article>}

              {hasProductBDeepDive && <article className="comparison-deep-dive-card">

                <h3>
                  {productB?.name}
                </h3>

                {(productB?.description || productB?.shortDescription) && <p>
                  {productB?.description ||
                    productB?.shortDescription}
                </p>}

                {comparison.productBBestFor?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Best For</h4>

                    <ul>
                      {comparison.productBBestFor.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {comparison.productBStrengths?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Strengths</h4>

                    <ul className="comparison-positive-list">
                      {comparison.productBStrengths.map(
                        (item, index) => (
                          <li key={index}>
                            ✓ {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {comparison.productBLimitations?.length > 0 && (
                  <div className="comparison-deep-section">
                    <h4>Limitations</h4>

                    <ul className="comparison-limit-list">
                      {comparison.productBLimitations.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              </article>}

            </div>
          </section>}

          {/* CONCLUSION */}

          {comparison.conclusion && <section
            className="comparison-content-section comparison-conclusion"
            id="final-verdict"
          >

            <span className="comparison-detail-label">
              FINAL VERDICT
            </span>

            <h2>
              Which Should You Choose?
            </h2>

            <p>
              {comparison.conclusion}
            </p>

          </section>}
          <ComparisonShare
            siteUrl={getSiteUrl()}
            title={comparison.title}
            slug={comparison.slug}
          />
          {(relatedReviews.length > 0 ||
            relatedBlogs.length > 0 ||
            relatedComparisons.length > 0) && (

              <section className="comparison-related-content">

                <div className="comparison-related-heading">

                  <span className="comparison-detail-label">
                    RELATED CONTENT
                  </span>

                  <h2>Continue Exploring</h2>

                  <p>
                    More SaaSpin reviews, guides and
                    software comparisons.
                  </p>

                </div>

                <div className="comparison-related-grid">

                  {relatedReviews.map((review) => (
                    <article
                      key={review._id}
                      className="comparison-related-card"
                    >
                      <span className="comparison-related-type">
                        REVIEW
                      </span>

                      <h3>{review.title}</h3>

                      <p>
                        {review.excerpt ||
                          review.quickVerdict}
                      </p>

                      <Link
                        href={`/reviews/${review.slug}`}
                      >
                        Read Review →
                      </Link>
                    </article>
                  ))}

                  {relatedBlogs.map((blog) => (
                    <article
                      key={blog._id}
                      className="comparison-related-card"
                    >
                      <span className="comparison-related-type">
                        BLOG
                      </span>

                      <h3>{blog.title}</h3>

                      <p>{blog.excerpt}</p>

                      <Link
                        href={`/blogs/${blog.slug}`}
                      >
                        Read Article →
                      </Link>
                    </article>
                  ))}

                  {relatedComparisons.map((item) => (
                    <article
                      key={item._id}
                      className="comparison-related-card"
                    >
                      <span className="comparison-related-type">
                        COMPARISON
                      </span>

                      <h3>{item.title}</h3>

                      <p>{item.excerpt}</p>

                      <Link
                        href={`/comparisons/${item.slug}`}
                      >
                        View Comparison →
                      </Link>
                    </article>
                  ))}

                </div>

              </section>
            )}

        {(productA || productB) && <div className="comparison-affiliate-section">
          <div className="comparison-affiliate-header">
            <span>EXPLORE THE SOFTWARE</span>

            <h2>
              Ready to explore your options?
            </h2>

            <p>
              Visit each product to learn more about its
              features, pricing and current offers.
            </p>
          </div>

          <div className="comparison-affiliate-grid">
            {productA && <div className="comparison-affiliate-card">
              <div>
                <span className="comparison-affiliate-tag">
                  OPTION A
                </span>

                <h3>
                  {comparison.productA.name}
                </h3>

                <p>
                  {comparison.productA.shortDescription ||
                    comparison.productA.description}
                </p>
              </div>

              <AffiliateButton
                product={comparison.productA}
                source="comparison"
                label={`Visit ${comparison.productA.name}`}
                className="full-width"
              />
            </div>}

            {productB && <div className="comparison-affiliate-card">
              <div>
                <span className="comparison-affiliate-tag">
                  OPTION B
                </span>

                <h3>
                  {comparison.productB.name}
                </h3>

                <p>
                  {comparison.productB.shortDescription ||
                    comparison.productB.description}
                </p>
              </div>

              <AffiliateButton
                product={comparison.productB}
                source="comparison"
                label={`Visit ${comparison.productB.name}`}
                className="full-width"
              />
            </div>}
          </div>
        </div>}
        </div>
      </main>
      <Footer />
    </>
  );
}
