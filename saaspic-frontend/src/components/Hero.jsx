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
            <span>The Independent SaaS Discovery & Review Platform</span>
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
            Discover vetted SaaS deals, in-depth software reviews, head-to-head
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
              <span>Read Expert Reviews</span>
            </Link>
          </div>

          {/* VALUE PROPOSITIONS */}
          <div className="saaspin-hero-features">
            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>
                {totalDeals > 0
                  ? `${totalDeals}+ Verified Deals`
                  : "Verified SaaS Deals"}
              </span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>
                {totalReviews > 0
                  ? `${totalReviews}+ Software Reviews`
                  : "Expert In-Depth Reviews"}
              </span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>Side-by-Side Comparisons</span>
            </div>

            <div className="saaspin-hero-feature-item">
              <span className="saaspin-feature-check">✓</span>
              <span>100% Free Forever</span>
            </div>
          </div>

          {/* SOCIAL PROOF BAR */}
          <div className="saaspin-hero-social-proof">
            <div className="hero-avatar-stack" aria-hidden="true">
              <span
                className="hero-avatar"
                style={{
                  background: "linear-gradient(135deg, #0E7490, #67C6D8)",
                }}
              >
                JD
              </span>
              <span
                className="hero-avatar"
                style={{
                  background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                }}
              >
                SK
              </span>
              <span
                className="hero-avatar"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                }}
              >
                MR
              </span>
              <span
                className="hero-avatar"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                }}
              >
                AL
              </span>
            </div>
            <div className="hero-social-text">
              <div className="hero-stars">
                <span className="stars-gold">★★★★★</span>
                <strong>4.9 / 5.0 TrustScore</strong>
              </div>
              <p>Trusted by 10,000+ founders & creators choosing software</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}