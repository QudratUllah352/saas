import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";
import "@/app/blog-layout.css";
import { pageMetadata } from "@/lib/seo";
import { fetchPublicList } from "@/lib/public-api";
import Navbar from "../../components/Navbar";
import BlogCard from "../../components/BlogCard";
import Footer from "../../components/Footer";

async function getBlogs() {
  return fetchPublicList("/blogs");
}

export const metadata = pageMetadata({
  "title": "SaaS Blog & Guides",
  "description": "Read practical SaaS guides and insights about software, productivity, and choosing tools for your work.",
  "path": "/blogs"
});

export default async function BlogsPage() {
  const blogs = await getBlogs();

  const featuredBlog = blogs[0] || null;
  const latestBlogs = blogs.slice(1);

  return (
    <>
      <Navbar />

      <main className="public-blogs-page public-page">
        <Breadcrumbs standalone blog items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blogs" }]} />

        <section className="public-blogs-hero">

          <span className="public-blogs-eyebrow">
            SAASPIN BLOG
          </span>

          <h1>
            Practical SaaS Insights
            <span> for Smarter Decisions</span>
          </h1>

          <p>
            Explore practical guides, software insights
            and ideas designed to help you understand
            SaaS tools and choose the right solutions
            for your workflow.
          </p>

          <div className="public-blogs-hero-actions">
            <a
              href="#latest-articles"
              className="public-blogs-primary-button"
            >
              Explore Articles ↓
            </a>
          </div>

        </section>


        <section
          className="public-blogs-content"
          id="latest-articles"
        >
          {blogs.length === 0 && (
            <div className="public-blogs-empty" role="status">
              <h2>No articles published yet</h2>
              <p>New SaaS guides and insights will appear here when they are published.</p>
            </div>
          )}
          {featuredBlog && (
            <section className="blogs-featured-section">

              <div className="blogs-featured-heading">
                <div>
                  <span className="public-blogs-section-label">
                    FEATURED GUIDE
                  </span>

                  <h2>Featured Article</h2>
                </div>
              </div>

              <BlogCard
                blog={featuredBlog}
                featured={true}
              />

            </section>
          )}
          {latestBlogs.length > 0 && (
            <section aria-labelledby="blogs-latest-title">
              <div className="blogs-latest-heading">
                <h2 id="blogs-latest-title">Latest Articles</h2>
              </div>
              <div className="public-blog-grid">
                {latestBlogs.map((blog) => (
                  <BlogCard
                    key={blog._id}
                    blog={blog}
                  />
                ))}
              </div>
            </section>
          )}

        </section>


        <section className="public-blogs-why">

          <div className="public-blogs-why-inner">

            <div className="public-blogs-why-heading">

              <span className="public-blogs-section-label">
                LEARN BEFORE YOU CHOOSE
              </span>

              <h2>
                Explore SaaS with More Context
              </h2>

              <p>
                SaaSpin articles help you explore
                software topics beyond individual
                product pages and deals.
              </p>

            </div>

            <div className="public-blogs-why-grid">

              <article>
                <span>01</span>
                <h3>Practical Guides</h3>
                <p>
                  Learn how SaaS products and
                  workflows can be used in practice.
                </p>
              </article>

              <article>
                <span>02</span>
                <h3>Software Insights</h3>
                <p>
                  Explore important ideas around
                  software features and use cases.
                </p>
              </article>

              <article>
                <span>03</span>
                <h3>Product Connections</h3>
                <p>
                  Discover products related to the
                  topics covered in each article.
                </p>
              </article>

              <article>
                <span>04</span>
                <h3>Better Decisions</h3>
                <p>
                  Build more context before choosing
                  software for your workflow.
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
