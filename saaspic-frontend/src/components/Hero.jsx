import Link from "next/link";

export default function Hero({
  totalReviews = 0,
  totalDeals = 0,
}) {
  return (
    <section className="saaspin-hero">
      <div className="saaspin-hero-glow saaspin-hero-glow-one" aria-hidden="true" />
      <div className="saaspin-hero-glow saaspin-hero-glow-two" aria-hidden="true" />
      <div className="saaspin-hero-glow saaspin-hero-glow-center" aria-hidden="true" />

      <div className="saaspin-hero-container">
        <div className="saaspin-hero-content">
          {/* TOP BADGE */}
          <div className="saaspin-hero-badge">
            <span className="saaspin-hero-badge-dot" aria-hidden="true" />
            <span className="saaspin-badge-sparkle">✨</span>
            <span>SaaS Deals, Reviews & Comparisons</span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="saaspin-hero-title">
            <span
              className="saaspin-hero-title-line saaspin-hero-line-one"
              style={{ color: "#000000" }}
            >
              Find the right SaaS tools.
            </span>
            <span className="saaspin-hero-highlight saaspin-hero-title-line saaspin-hero-line-two">
              Save more. Work smarter.
            </span>
          </h1>

          {/* SUBTITLE */}
          <p className="saaspin-hero-description">
            Discover SaaS deal listings, software reviews, side-by-side
            comparisons and practical guides to help you make confident software decisions.
          </p>

          {/* CTA ACTIONS */}
          <div className="saaspin-hero-actions">
            <Link href="/deals" className="saaspin-hero-primary">
              <span>Explore Deals</span>
              <span className="hero-btn-arrow">→</span>
            </Link>

            <Link href="/comparisons" className="saaspin-hero-secondary">
              <span>Compare Software</span>
              <span className="hero-btn-icon">⇄</span>
            </Link>

            <Link href="/reviews" className="saaspin-hero-reviews-link">
              <span className="hero-btn-star">★</span>
              <span>Read Software Reviews</span>
            </Link>
          </div>

          {/* VALUE PROPOSITIONS */}
          <div className="saaspin-hero-features">
            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>
                {totalDeals > 0
                  ? `${totalDeals} Deal Listings`
                  : "Browse SaaS Deals"}
              </span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>
                {totalReviews > 0
                  ? `${totalReviews} Software Reviews`
                  : "Software Reviews"}
              </span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>Side-by-Side Comparisons</span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>Browse Deals by Category</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}