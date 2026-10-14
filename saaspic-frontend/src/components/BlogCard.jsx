import Link from "next/link";
import "./blog-cards.css";

export default function BlogCard({
  blog,
  featured = false,
}) {
  if (!blog) return null;

  return (
    <article
      className={
        featured
          ? "premium-blog-card premium-blog-featured"
          : "premium-blog-card premium-blog-small"
      }
    >
      <Link
        href={`/blogs/${blog.slug}`}
        className="premium-blog-image"
      >
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.title || "SaaS article"}
          />
        ) : (
          <div className="premium-blog-placeholder">
            <div className="premium-blog-placeholder-icon">
              S
            </div>

            <span>SaaSpin Insights</span>
          </div>
        )}

        <span className="premium-blog-category">
          {blog.category || "SaaS"}
        </span>
      </Link>

      <div className="premium-blog-body">

        <div className="premium-blog-meta">
          <span>
            {blog.author || "SaaSpin Team"}
          </span>

          {blog.publishedAt && (
            <>
              <span className="premium-blog-meta-dot">
                •
              </span>

              <span>
                {new Date(
                  blog.publishedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}

          <span className="premium-blog-meta-dot">
            •
          </span>

          <span>
            {blog.readTime || 5} min read
          </span>
        </div>

        <Link
          href={`/blogs/${blog.slug}`}
          className="premium-blog-title"
        >
          {featured ? (
            <h2>{blog.title}</h2>
          ) : (
            <h3>{blog.title}</h3>
          )}
        </Link>

        <p className="premium-blog-excerpt">
          {blog.excerpt ||
            "Explore SaaS insights, software guides and practical ideas."}
        </p>

        {featured &&
          Array.isArray(blog.tags) &&
          blog.tags.length > 0 && (
            <div className="premium-blog-tags">
              {blog.tags
                .slice(0, 3)
                .map((tag, index) => (
                  <span key={index}>
                    {tag}
                  </span>
                ))}
            </div>
          )}

        <Link
          href={`/blogs/${blog.slug}`}
          className="premium-blog-read"
        >
          Read Full Article
          <span>→</span>
        </Link>

      </div>
    </article>
  );
}
