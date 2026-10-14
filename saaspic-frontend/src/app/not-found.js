import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="site-state-page">

        <div className="site-state-code">
          404
        </div>

        <h1>Page Not Found</h1>

        <p>
          The page you are looking for does
          not exist or may have been moved.
        </p>

        <div className="site-state-actions">

          <Link
            href="/"
            className="site-state-primary"
          >
            Go to Homepage
          </Link>

          <Link
            href="/deals"
            className="site-state-secondary"
          >
            Browse Deals
          </Link>

        </div>

      </main>

      <Footer />
    </>
  );
}