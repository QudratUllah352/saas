import "@/app/public-pages.css";
import "@/app/blog-layout.css";
import "./blog-detail.css";
import { pageMetadata, unavailableMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import AffiliateButton from "../../../components/AffiliateButton";
import BlogShare from "../../../components/BlogShare";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${API_URL}/blogs/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return unavailableMetadata("Blog unavailable");
    }

    const blog = await response.json();

    const title =
      blog.title ||
      "SaaS Guide";

    const description =
      blog.excerpt ||
      blog.introduction ||
      "Explore SaaS insights, software guides, and practical resources from SaaSpin.";

    return pageMetadata({
      title,
      description,
      path: `/blogs/${encodeURIComponent(blog.slug)}`,
      image: blog.coverImage || undefined,
      type: "article",
    });
  } catch (error) {
    console.error(
      "Blog metadata fetch error:",
      error
    );

    return unavailableMetadata("Blog unavailable");
  }
}
async function getRelatedReviews(productIds) {
  if (!productIds.length) return [];

  try {
    const response = await fetch(
      `${API_URL}/reviews`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const reviews = await response.json();

    return reviews
      .filter((review) =>
        productIds.includes(
          review.product?._id
        )
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function getRelatedComparisons(
  productIds
) {
  if (!productIds.length) return [];

  try {
    const response = await fetch(
      `${API_URL}/comparisons`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const comparisons =
      await response.json();

    return comparisons
      .filter((comparison) => {
        const productA =
          comparison.productA?._id;

        const productB =
          comparison.productB?._id;

        return (
          productIds.includes(productA) ||
          productIds.includes(productB)
        );
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function getRelatedBlogs(
  currentBlog,
  productIds
) {
  try {
    const response = await fetch(
      `${API_URL}/blogs`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const blogs = await response.json();

    return blogs
      .filter((item) => {
        if (item._id === currentBlog._id) {
          return false;
        }

        const sameProduct =
          item.relatedProducts?.some(
            (product) =>
              productIds.includes(product._id)
          );

        const sameCategory =
          currentBlog.category &&
          item.category ===
          currentBlog.category;

        return sameProduct || sameCategory;
      })
      .slice(0, 3);
  } catch {
    return [];
  }
}
export default async function BlogDetailPage({ params }) {
  // Next.js 16 dynamic route
  const { slug } = await params;

  const response = await fetch(
    `${API_URL}/blogs/${slug}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return (
      <>
        <Navbar />

        <main className="blog-error-page public-page">
          <h1>Blog could not be loaded</h1>

          <p>
            The article may have been removed
            or unpublished.
          </p>

          <Link href="/blogs">
            ← Back to Blogs
          </Link>
        </main>

        <Footer />
      </>
    );
  }

  const blog = await response.json();

  const publishedDate = blog.publishedAt
    ? new Date(
      blog.publishedAt
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    : "";
  const relatedProductIds =
    blog.relatedProducts
      ?.map((product) => product._id)
      .filter(Boolean) || [];

  const [
    relatedReviews,
    relatedComparisons,
    relatedBlogs,
  ] = await Promise.all([
    getRelatedReviews(
      relatedProductIds
    ),
    getRelatedComparisons(
      relatedProductIds
    ),
    getRelatedBlogs(
      blog,
      relatedProductIds
    ),
  ]);

  return (
    <>
      <Navbar />

      <main className="blog-detail-page public-page">


        {/* BLOG HEADER */}

        <header className="blog-detail-hero">

          <div className="blog-detail-header-content">
            <span className="blog-detail-eyebrow">
              SAASPIN GUIDE
            </span>
            {blog.category && <span className="blog-detail-category">{blog.category}</span>}

            <h1>
              {blog.title}
            </h1>

            {blog.excerpt && <p className="blog-detail-excerpt">
              {blog.excerpt}
            </p>}


            {/* AUTHOR / DATE */}

            {(blog.author || publishedDate || blog.readTime) && <div className="blog-detail-meta">

              {blog.author && <span>
                By{" "}
                <strong>
                  {blog.author}
                </strong>
              </span>}

              {publishedDate && (
                <time dateTime={blog.publishedAt}>
                  {publishedDate}
                </time>
              )}

              {blog.readTime && <span>{blog.readTime} min read</span>}

            </div>}


            {/* TAGS */}

            {blog.tags?.length > 0 && (

              <div className="blog-detail-tags">

                {blog.tags.map(
                  (tag) => (

                    <span key={tag}>
                      #{tag}
                    </span>

                  )
                )}

              </div>

            )}

          </div>

        </header>


        {/* ARTICLE + SIDEBAR */}

        <div className="blog-detail-layout">
        {blog.sections?.length > 0 && (
          <div className="blog-toc-panel">

            <nav
              className="blog-on-page"
              aria-label="On this page"
            >
              <span>ON THIS PAGE</span>

              <div className="blog-on-page-links">

                {blog.introduction && <a href="#introduction">
                  Introduction
                </a>}

                {blog.sections.map(
                  (section, index) => section.heading && (
                    <a
                      key={`${section.heading}-${index}`}
                      href={`#section-${index}`}
                    >
                      {section.heading}
                    </a>
                  )
                )}

                {blog.conclusion && (
                  <a href="#final-thoughts">
                    Final Thoughts
                  </a>
                )}

              </div>
            </nav>

          </div>
        )}



          {/* ARTICLE */}

          <article className="blog-article">
        {/* COVER IMAGE */}

        {blog.coverImage && (

          <div className="blog-detail-cover">

            <img
              src={blog.coverImage}
              alt={blog.title}
            />

          </div>

        )}



            {/* INTRODUCTION */}

            {blog.introduction && <section
              className="blog-article-introduction"
              id="introduction"
            >
              <span className="blog-article-section-label">
                INTRODUCTION
              </span>
              <p>
                {blog.introduction}
              </p>

            </section>}


            {/* ARTICLE SECTIONS */}

            {blog.sections?.map(
              (section, index) => (section.heading || section.content) && (

                <section
                  className="blog-article-section"
                  id={`section-${index}`}
                  key={`${section.heading}-${index}`}
                >

                  {section.heading && <h2>
                    {section.heading}
                  </h2>}

                  {section.content && <p>
                    {section.content}
                  </p>}

                </section>

              )
            )}


            {/* CONCLUSION */}

            {blog.conclusion && <section
              className="blog-article-conclusion"
              id="final-thoughts"
            >
              <span className="blog-article-section-label">
                FINAL THOUGHTS
              </span>
              <h2>
                Key Takeaways
              </h2>

              <p>
                {blog.conclusion}
              </p>

            </section>}
            <BlogShare
              title={blog.title}
              slug={blog.slug}
            />
          </article>


          {/* SIDEBAR */}

          <aside className="blog-detail-sidebar">

            {blog.relatedProducts?.length > 0 && (
              <section className="blog-related-software">
                <div className="blog-related-software-header">
                  <span>TOOLS IN THIS GUIDE</span>

                  <h2>
                    Explore Related Software
                  </h2>

                  <p>
                    Explore the software connected to this
                    guide and learn more about each product.
                  </p>
                </div>

                <div className="blog-related-software-grid">
                  {blog.relatedProducts.map((product) => (
                    <article
                      key={product._id}
                      className="blog-related-software-card"
                    >
                      <div className="blog-related-software-info">
                        {product.logo && (
                          <img
                            src={product.logo}
                            alt={`${product.name} logo`}
                            className="blog-related-software-logo"
                          />
                        )}

                        <div>
                          <span>
                            {product.category?.name ||
                              "Software"}
                          </span>

                          <h3>{product.name}</h3>

                          <p>
                            {product.shortDescription ||
                              product.description}
                          </p>
                        </div>
                      </div>

                      <AffiliateButton
                        product={product}
                        source="blog"
                        label={`Visit ${product.name}`}
                        className="full-width"
                      />
                    </article>
                  ))}
                </div>
              </section>
            )}


            {/* EXPLORE */}

            <div className="blog-related-card">

              <h3>
                Explore SaaSpin
              </h3>

              <p>
                Discover more software
                resources.
              </p>

              <div className="blog-sidebar-links">

                <Link href="/deals">
                  SaaS Deals →
                </Link>

                <Link href="/reviews">
                  Software Reviews →
                </Link>

                <Link href="/comparisons">
                  Comparisons →
                </Link>

                <Link href="/blogs">
                  More Articles →
                </Link>

              </div>

            </div>

          </aside>

        </div>
        {(relatedReviews.length > 0 ||
          relatedComparisons.length > 0 ||
          relatedBlogs.length > 0) && (

            <section className="blog-related-content">

              <div className="blog-detail-container">

                <div className="blog-related-content-heading">

                  <span>
                    RELATED CONTENT
                  </span>

                  <h2>
                    Continue Exploring
                  </h2>

                  <p>
                    More SaaSpin reviews, comparisons
                    and practical SaaS guides.
                  </p>

                </div>

                <div className="blog-related-content-grid">

                  {relatedReviews.map((review) => (

                    <article
                      key={review._id}
                      className="blog-related-content-card"
                    >
                      <span className="blog-related-type">
                        REVIEW
                      </span>

                      <h3>
                        {review.title}
                      </h3>

                      <p>
                        {review.excerpt ||
                          review.quickVerdict}
                      </p>

                      <Link
                        href={`/reviews/${review.slug}`}
                      >
                        Read Review →
                      </Link>
                    </article>

                  ))}


                  {relatedComparisons.map(
                    (comparison) => (

                      <article
                        key={comparison._id}
                        className="blog-related-content-card"
                      >
                        <span className="blog-related-type">
                          COMPARISON
                        </span>

                        <h3>
                          {comparison.title}
                        </h3>

                        <p>
                          {comparison.excerpt}
                        </p>

                        <Link
                          href={`/comparisons/${comparison.slug}`}
                        >
                          View Comparison →
                        </Link>
                      </article>

                    )
                  )}


                  {relatedBlogs.map((item) => (

                    <article
                      key={item._id}
                      className="blog-related-content-card"
                    >
                      <span className="blog-related-type">
                        GUIDE
                      </span>

                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {item.excerpt}
                      </p>

                      <Link
                        href={`/blogs/${item.slug}`}
                      >
                        Read Article →
                      </Link>
                    </article>

                  ))}

                </div>

              </div>

            </section>

          )}
        <div className="blog-detail-container">

          <div className="blog-detail-bottom-back">

            <Link href="/blogs">
              ← Back to all posts
            </Link>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
