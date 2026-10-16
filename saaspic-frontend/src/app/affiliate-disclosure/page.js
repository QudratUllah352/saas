import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";


export const metadata = pageMetadata({
  "title": "Affiliate Disclosure",
  "description": "Learn how affiliate links work on SaaSpin and how they may support the site.",
  "path": "/affiliate-disclosure"
});

export default function AffiliateDisclosurePage() {
  return (
    <>
    <Navbar />
    <main className="affiliate-disclosure-page public-page">
      <div className="affiliate-disclosure-container">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Affiliate Disclosure", path: "/affiliate-disclosure" }]} />
        <div className="affiliate-disclosure-header">
          <span>AFFILIATE DISCLOSURE</span>

          <h1>How affiliate links work on SaaSpin</h1>

          <p>
            SaaSpin helps users discover SaaS products,
            deals, reviews, comparisons and software
            resources. Some links on SaaSpin may be
            affiliate links.
          </p>
        </div>

        <div className="affiliate-disclosure-content">
          <section>
            <h2>What is an affiliate link?</h2>

            <p>
              An affiliate link is a special link that may
              allow SaaSpin to receive a commission when
              someone follows the link and completes an
              eligible purchase or other qualifying action.
            </p>
          </section>

          <section>
            <h2>Does it cost you more?</h2>

            <p>
              Using an affiliate link does not normally
              change the price you pay. Pricing and purchase
              terms are determined by the software provider.
            </p>
          </section>

          <section>
            <h2>Reviews and comparisons</h2>

            <p>
              Affiliate relationships should not determine
              the editorial conclusions of SaaSpin reviews
              or comparisons. We aim to present useful
              information about products, including relevant
              strengths and limitations.
            </p>
          </section>

          <section>
            <h2>Affiliate tracking</h2>

            <p>
              When you use an affiliate link, the destination
              provider or affiliate network may use cookies
              or similar technologies to attribute eligible
              purchases or actions to SaaSpin.
            </p>
          </section>

          <section>
            <h2>Not every link is an affiliate link</h2>

            <p>
              SaaSpin may link to software providers even
              when no affiliate relationship exists. When
              appropriate, affiliate links are accompanied
              by a disclosure near the relevant link.
            </p>
          </section>

          <section>
            <h2>Questions</h2>

            <p>
              If you have questions about how SaaSpin uses
              affiliate links, you can contact us through
              the contact information provided on the site.
            </p>
          </section>
        </div>

        <div className="affiliate-disclosure-back">
          <Link href="/">
            ← Back to SaaSpin
          </Link>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
