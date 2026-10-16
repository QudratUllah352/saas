import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import { pageMetadata } from "@/lib/seo";
import { fetchPublicList } from "@/lib/public-api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ReviewCard from "../../components/ReviewCard";

async function getReviews() {
  return fetchPublicList("/reviews");
}

export const metadata = pageMetadata({
  "title": "SaaS Reviews",
  "description": "Explore software reviews covering features, pricing, strengths, limitations, and alternatives.",
  "path": "/reviews"
});

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <>
      <Navbar />

      <main className="reviews-page public-page">
        <Breadcrumbs standalone items={[{ name: "Home", path: "/" }, { name: "Reviews", path: "/reviews" }]} />
        <section className="reviews-hero">
          <div className="reviews-container">
            <p className="reviews-label">
              SAAS REVIEWS
            </p>

            <h1>
              Honest reviews of SaaS tools
            </h1>

            <p>
              Explore detailed software reviews,
              ratings, features, pricing, pros and cons
              to help you discover the right software.
            </p>
          </div>
        </section>

        <section className="reviews-section">
          <div className="reviews-container">
            <div className="reviews-heading">
              <div>
                <span>SOFTWARE REVIEWS</span>

                <h2>
                  Latest Reviews
                </h2>

                <p>
                  Explore our latest published SaaS
                  software reviews.
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="reviews-empty">
                <h3>No reviews published yet</h3>

                <p>
                  Published software reviews will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}