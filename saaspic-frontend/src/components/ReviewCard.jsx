import Link from "next/link";

export default function ReviewCard({ review }) {
  const product = review?.product || {};
  const category = product?.category?.name || "SaaS";

  const rating = review?.overallRating;
  const hasRating = typeof rating === "number" && Number.isFinite(rating) && rating >= 0 && rating <= 5;

  return (
    <article className="premium-review-card">

      <div className="premium-review-card-top">

        <span className="premium-review-category">
          {category}
        </span>

        {hasRating && <div className="premium-review-rating">
          <span>★</span>
          <strong>{rating.toFixed(1)}</strong>
        </div>}

      </div>


      <div className="premium-review-product">

        <div className="premium-review-logo">
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

        <div>
          <span className="premium-review-product-label">
            SOFTWARE REVIEW
          </span>

          <p className="premium-review-product-name">
            {product?.name || "Software"}
          </p>
        </div>

      </div>


      <div className="premium-review-content">

        <h3>
          {review?.title || "Software Review"}
        </h3>

        <p>
          {review?.excerpt ||
            review?.quickVerdict ||
            "Read our detailed analysis of this SaaS product."}
        </p>

      </div>


      {review?.topPros?.length > 0 && (
        <div className="premium-review-pros">

          {review.topPros
            .slice(0, 2)
            .map((pro, index) => (
              <div key={index}>
                <span>✓</span>
                {pro}
              </div>
            ))}

        </div>
      )}


      <div className="premium-review-meta">

        {hasRating && <div>
          <span>Editorial rating</span>

          <strong>
            {rating.toFixed(1)}
            <small>/5</small>
          </strong>
        </div>}

        <div>
          <span>Read time</span>

          <strong>
            {review?.readTime || 5}
            <small> min</small>
          </strong>
        </div>

      </div>


      <Link
        href={`/reviews/${review?.slug}`}
        className="premium-review-button"
      >
        Read full review

        <span>→</span>
      </Link>

    </article>
  );
}