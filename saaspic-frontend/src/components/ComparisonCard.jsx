import Link from "next/link";

function ProductLogo({ product }) {
  return (
    <div className="premium-comparison-product">
      <div className="premium-comparison-logo">
        {product?.logo ? (
          <img
            src={product.logo}
            alt={`${product.name || "Software"} logo`}
          />
        ) : (
          <span>
            {(product?.name || "S")
              .charAt(0)
              .toUpperCase()}
          </span>
        )}
      </div>

      <h3>{product?.name || "Software"}</h3>

      <span>
        {product?.category?.name || "SaaS"}
      </span>
    </div>
  );
}

export default function ComparisonCard({ comparison }) {
  const productA = comparison?.productA || {};
  const productB = comparison?.productB || {};

  return (
    <article className="premium-comparison-card">

      <div className="premium-comparison-top">
        <span className="premium-comparison-label">
          HEAD-TO-HEAD
        </span>

        <span className="premium-comparison-time">
          {comparison?.readTime || 5} min read
        </span>
      </div>

      <div className="premium-comparison-products">

        <ProductLogo product={productA} />

        <div className="premium-comparison-vs">
          VS
        </div>

        <ProductLogo product={productB} />

      </div>

      <div className="premium-comparison-meta">
        <span>
          {comparison?.author || "SaaSpin Team"}
        </span>

        {comparison?.publishedAt && (
          <>
            <span>•</span>

            <span>
              {new Date(
                comparison.publishedAt
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </>
        )}
      </div>

      <div className="premium-comparison-highlights">

        <div>
          <span className="premium-comparison-check">
            ✓
          </span>

          <span>
            Features
          </span>
        </div>

        <div>
          <span className="premium-comparison-check">
            ✓
          </span>

          <span>
            Strengths
          </span>
        </div>

        <div>
          <span className="premium-comparison-check">
            ✓
          </span>

          <span>
            Limitations
          </span>
        </div>

      </div>

      <Link
        href={`/comparisons/${comparison?.slug}`}
        className="premium-comparison-button"
      >
        Read Full Comparison

        <span>→</span>
      </Link>

    </article>
  );
}