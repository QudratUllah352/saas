import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import { pageMetadata } from "@/lib/seo";
import { fetchPublicList } from "@/lib/public-api";
import Navbar from "../../components/Navbar";
import ComparisonCard from "../../components/ComparisonCard";
import Footer from "../../components/Footer";

async function getComparisons() {
  return fetchPublicList("/comparisons");
}

export const metadata = pageMetadata({
  "title": "SaaS Comparisons",
  "description": "Compare SaaS products side by side to explore features, pricing, strengths, and use cases.",
  "path": "/comparisons"
});

export default async function ComparisonsPage() {
  const comparisons = await getComparisons();

  return (
    <>
      <Navbar />

      <main className="comparisons-page public-page">
        <Breadcrumbs standalone items={[{ name: "Home", path: "/" }, { name: "Comparisons", path: "/comparisons" }]} />
        <section className="comparisons-hero">
          <div className="comparisons-hero-content">

            <span className="comparisons-label">
              COMPARE SOFTWARE
            </span>

            <h1>
              Find the Right SaaS Tool
              <span> for Your Business</span>
            </h1>

            <p>
              Compare software side by side and explore
              features, strengths, limitations and ideal
              use cases before making your decision.
            </p>

            <div className="comparisons-hero-actions">

              <a
                href="#latest-comparisons"
                className="comparisons-primary-button"
              >
                Explore Comparisons ↓
              </a>

            </div>

          </div>
        </section>

        <section
          className="comparisons-section"
          id="latest-comparisons"
        >
          <div className="comparisons-container">

            <div className="comparisons-heading">
              <div>
                <span>SOFTWARE COMPARISONS</span>
                <h2>Head-to-Head Comparisons</h2>

                <p>
                  Explore side-by-side SaaS comparisons designed
                  to make important differences easier to understand.
                </p>
              </div>
            </div>

            {comparisons.length === 0 ? (
              <div className="comparisons-empty">
                <h3>No comparisons published yet</h3>

                <p>
                  Published software comparisons will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="comparisons-grid">
                {comparisons.map((comparison) => (
                  <ComparisonCard
                    key={comparison._id}
                    comparison={comparison}
                  />
                ))}
              </div>
            )}

          </div>
        </section>
        <section className="comparisons-why">

          <div className="comparisons-container">

            <div className="comparisons-why-heading">

              <span className="comparisons-label">
                MAKE A BETTER DECISION
              </span>

              <h2>
                Why Compare with SaaSpin?
              </h2>

              <p>
                Focus on the differences that matter when
                choosing software for your workflow.
              </p>

            </div>

            <div className="comparisons-why-grid">

              <article className="comparisons-why-card">
                <span>01</span>

                <h3>Side-by-Side Analysis</h3>

                <p>
                  Compare important product differences
                  in one clear view.
                </p>
              </article>

              <article className="comparisons-why-card">
                <span>02</span>

                <h3>Strengths & Limitations</h3>

                <p>
                  Understand where each product stands
                  out and where it may fall short.
                </p>
              </article>

              <article className="comparisons-why-card">
                <span>03</span>

                <h3>Best-Fit Guidance</h3>

                <p>
                  See which types of users and workflows
                  each product is designed for.
                </p>
              </article>

              <article className="comparisons-why-card">
                <span>04</span>

                <h3>Detailed Comparisons</h3>

                <p>
                  Explore comparison points before
                  deciding which software to investigate.
                </p>
              </article>

            </div>

          </div>

        </section>
      </main>
      <Footer />
    </>
  );
}