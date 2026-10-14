import Link from "next/link";

export default function ReviewCard({ review }) {
  const product = review?.product || {};
  const category = product?.category?.name || "SaaS";

  const rating =
    Number(review?.overallRating) || 0;

  return (
    <article className="premium-review-card">

      <div className="premium-review-card-top">

        <span className="premium-review-category">
          {category}
        </span>

        <div className="premium-review-rating">
          <span>★</span>
          <strong>{rating.toFixed(1)}</strong>
        </div>

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

          <h3>
            {product?.name || "Software"}
          </h3>
        </div>

      </div>


      <div className="premium-review-content">

        <h2>
          {review?.title || "Software Review"}
        </h2>

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

        <div>
          <span>Rating</span>

          <strong>
            {rating.toFixed(1)}
            <small>/5</small>
          </strong>
        </div>

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