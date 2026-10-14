import Link from "next/link";

const features = [
  {
    number: "01",
    icon: "↗",
    title: "Curated SaaS Deals",
    description:
      "Explore active software deals across AI, productivity, marketing, design, development and other SaaS categories.",
    link: "/deals",
    linkText: "Explore deals",
  },
  {
    number: "02",
    icon: "★",
    title: "Detailed Reviews",
    description:
      "Understand software through detailed reviews covering features, pricing, strengths, limitations and ideal use cases.",
    link: "/reviews",
    linkText: "Read reviews",
  },
  {
    number: "03",
    icon: "⇄",
    title: "Software Comparisons",
    description:
      "Compare SaaS products side by side to understand their differences before deciding which solution fits your needs.",
    link: "/comparisons",
    linkText: "Compare software",
  },
  {
    number: "04",
    icon: "✦",
    title: "Useful SaaS Insights",
    description:
      "Discover practical guides, software insights and articles designed to help you find and understand useful SaaS tools.",
    link: "/blogs",
    linkText: "Explore insights",
  },
];

export default function WhySaaSpin() {
  return (
    <section className="why-saaspin-section">
      <div className="home-container">

        <div className="why-saaspin-header">

          <div className="why-saaspin-heading">
            <span className="why-saaspin-eyebrow">
              WHY SAASPIN
            </span>

            <h2>
              Everything you need to
              <br />
              discover better software.
            </h2>
          </div>

          <p className="why-saaspin-intro">
            SaaSpin brings software discovery, deals,
            reviews, comparisons and useful SaaS insights
            together in one place.
          </p>

        </div>

        <div className="why-saaspin-grid">

          {features.map((feature) => (
            <article
              className="why-saaspin-card"
              key={feature.number}
            >
              <div className="why-card-top">
                <span className="why-card-number">
                  {feature.number}
                </span>

                <div className="why-card-icon">
                  {feature.icon}
                </div>
              </div>

              <div className="why-card-content">
                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </div>

              <Link
                href={feature.link}
                className="why-card-link"
              >
                {feature.linkText}
                <span>→</span>
              </Link>
            </article>
          ))}

        </div>

        <div className="why-saaspin-bottom">

          <div>
            <span className="why-bottom-icon">✦</span>

            <div>
              <strong>
                One place for SaaS discovery
              </strong>

              <p>
                Find deals, research products and compare
                your options without jumping between
                different sections of the web.
              </p>
            </div>
          </div>

          <Link
            href="/deals"
            className="why-bottom-button"
          >
            Start exploring
            <span>→</span>
          </Link>

        </div>

      </div>
    </section>
  );
}