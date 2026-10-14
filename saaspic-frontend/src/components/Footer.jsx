import Link from "next/link";
import { categories } from "@/lib/categories";
import FooterDeals from "./FooterDeals";

const exploreLinks = [
  { name: "Reviews", href: "/reviews" },
  { name: "Comparisons", href: "/comparisons" },
  { name: "SaaS Insights", href: "/blogs" },
];

const categoryLinks = categories.map((category) => ({ name: category.name, href: '/deals?category=' + category.slug }));

const resourceLinks = [
  { name: "Submit a Deal", href: "/submit-deal" },
  { name: "Search", href: "/search" },
  { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="premium-footer">

      <div className="premium-footer-glow premium-footer-glow-one" />
      <div className="premium-footer-glow premium-footer-glow-two" />

      <div className="home-container">

        <div className="premium-footer-main">

          {/* BRAND */}

          <div className="premium-footer-brand">

            <Link
              href="/"
              className="premium-footer-logo"
            >
              <span className="premium-footer-logo-icon">
                S
              </span>

              <span>
                SaaS<span>pin</span>
              </span>
            </Link>

            <p>
              Discover SaaS tools, explore software
              deals, read detailed reviews and compare
              products before choosing what works for you.
            </p>

            <div className="premium-footer-brand-note">
              <span>✦</span>
              Discover better software.
            </div>

          </div>


          {/* EXPLORE */}

          <div className="premium-footer-column">

            <h3>Explore</h3>

            <nav>
              <FooterDeals categories={categoryLinks} />
              {exploreLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

          </div>


          {/* CATEGORIES */}

          <div className="premium-footer-column">

            <h3>Categories</h3>

            <nav>
              {categoryLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

          </div>


          {/* RESOURCES */}

          <div className="premium-footer-column">

            <h3>Resources</h3>

            <nav>
              {resourceLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

          </div>

        </div>


        <div className="premium-footer-divider" />


        <div className="premium-footer-bottom">

          <p>
            © {currentYear} SaaSpin. All rights reserved.
          </p>

          <div className="premium-footer-bottom-links">

            <span>
              Built for SaaS discovery
            </span>

            <span className="premium-footer-dot">
              •
            </span>

            <Link href="/">
              SaaSpin
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}
