import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getComparison(slug) {
  try {
    const response = await fetch(
      `${API_URL}/comparisons/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch comparison.");
    }

    return await response.json();
  } catch (error) {
    console.error("Comparison fetch error:", error);
    return null;
  }
}

function ProductLogo({ product }) {
  const name = product?.name || "Product";

  return (
    <div className="comparison-detail-logo">
      {product?.logo ? (
        <img
          src={product.logo}
          alt={name}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default async function ComparisonDetailPage({
  params,
}) {
  const { slug } = await params;

  const comparison = await getComparison(slug);

  if (!comparison) {
    notFound();
  }

  const productA = comparison.productA;
  const productB = comparison.productB;

  const productAName =
    productA?.name || "Product A";

  const productBName =
    productB?.name || "Product B";

  return (
    <>

      <main className="comparison-detail-page">

        {/* BREADCRUMB */}

        <section className="comparison-detail-container">

          <div className="comparison-breadcrumb">
            <Link href="/">
              Home
            </Link>

            <span>→</span>

            <Link href="/comparisons">
              Comparisons
            </Link>

            <span>→</span>

            <span>
              {comparison.title}
            </span>
          </div>

        </section>

        {/* HERO */}

        <section className="comparison-detail-hero">

          <div className="comparison-detail-container">

            <span className="comparison-detail-label">
              SOFTWARE COMPARISON
            </span>

            <h1>
              {comparison.title}
            </h1>

            <p className="comparison-detail-excerpt">
              {comparison.excerpt}
            </p>

            <div className="comparison-detail-meta">

              <span>
                By{" "}
                {comparison.author ||
                  "SaaSpin Team"}
              </span>

              <span>•</span>

              <span>
                {comparison.readTime || 5}
                {" "}min read
              </span>

            </div>

            {/* PRODUCT VS PRODUCT */}

            <div className="comparison-detail-products">

              <div className="comparison-detail-product">

                <ProductLogo
                  product={productA}
                />

                <h2>
                  {productAName}
                </h2>

                <p>
                  {productA?.shortDescription ||
                    productA?.description ||
                    ""}
                </p>

                {productA?.website && (
                  <a
                    href={productA.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="comparison-product-link"
                  >
                    Visit Website ↗
                  </a>
                )}

              </div>

              <div className="comparison-detail-vs">
                VS
              </div>

              <div className="comparison-detail-product">

                <ProductLogo
                  product={productB}
                />

                <h2>
                  {productBName}
                </h2>

                <p>
                  {productB?.shortDescription ||
                    productB?.description ||
                    ""}
                </p>

                {productB?.website && (
                  <a
                    href={productB.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="comparison-product-link"
                  >
                    Visit Website ↗
                  </a>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* ARTICLE */}

        <section className="comparison-detail-content">

          <div className="comparison-detail-container">

            {/* INTRODUCTION */}

            <article className="comparison-content-section">

              <h2>Overview</h2>

              <p>
                {comparison.introduction}
              </p>

            </article>

            {/* COMPARISON TABLE */}

            {comparison.comparisonPoints?.length >
              0 && (
              <article className="comparison-content-section">

                <h2>
                  {productAName} vs{" "}
                  {productBName}: Comparison
                </h2>

                <div className="comparison-table-wrapper">

                  <table className="comparison-table">

                    <thead>
                      <tr>
                        <th>
                          Comparison
                        </th>

                        <th>
                          {productAName}
                        </th>

                        <th>
                          {productBName}
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {comparison.comparisonPoints.map(
                        (point, index) => (
                          <tr key={index}>

                            <th>
                              {point.title}
                            </th>

                            <td>
                              {point.productA}
                            </td>

                            <td>
                              {point.productB}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </article>
            )}

            {/* BEST FOR */}

            <article className="comparison-content-section">

              <h2>Which one is best for you?</h2>

              <div className="comparison-two-columns">

                <div className="comparison-info-box">

                  <h3>
                    {productAName} is best for
                  </h3>

                  {comparison.productABestFor
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productABestFor.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      Target users are not
                      specified.
                    </p>
                  )}

                </div>

                <div className="comparison-info-box">

                  <h3>
                    {productBName} is best for
                  </h3>

                  {comparison.productBBestFor
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productBBestFor.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      Target users are not
                      specified.
                    </p>
                  )}

                </div>

              </div>

            </article>

            {/* STRENGTHS */}

            <article className="comparison-content-section">

              <h2>Strengths</h2>

              <div className="comparison-two-columns">

                <div className="comparison-info-box">

                  <h3>
                    {productAName}
                  </h3>

                  {comparison.productAStrengths
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productAStrengths.map(
                        (item, index) => (
                          <li key={index}>
                            ✓ {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No strengths specified.
                    </p>
                  )}

                </div>

                <div className="comparison-info-box">

                  <h3>
                    {productBName}
                  </h3>

                  {comparison.productBStrengths
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productBStrengths.map(
                        (item, index) => (
                          <li key={index}>
                            ✓ {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No strengths specified.
                    </p>
                  )}

                </div>

              </div>

            </article>

            {/* LIMITATIONS */}

            <article className="comparison-content-section">

              <h2>Limitations</h2>

              <div className="comparison-two-columns">

                <div className="comparison-info-box">

                  <h3>
                    {productAName}
                  </h3>

                  {comparison.productALimitations
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productALimitations.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No limitations specified.
                    </p>
                  )}

                </div>

                <div className="comparison-info-box">

                  <h3>
                    {productBName}
                  </h3>

                  {comparison.productBLimitations
                    ?.length > 0 ? (
                    <ul>
                      {comparison.productBLimitations.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No limitations specified.
                    </p>
                  )}

                </div>

              </div>

            </article>

            {/* CONCLUSION */}

            <article className="comparison-content-section comparison-conclusion">

              <span className="comparison-detail-label">
                FINAL THOUGHTS
              </span>

              <h2>Conclusion</h2>

              <p>
                {comparison.conclusion}
              </p>

            </article>

            {/* BOTTOM ACTION */}

            <div className="comparison-bottom-action">

              <Link
                href="/comparisons"
                className="admin-secondary-button"
              >
                ← View More Comparisons
              </Link>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}
