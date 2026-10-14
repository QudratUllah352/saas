"use client";

import AdminRecordTable, { AdminStatus } from "@/components/AdminRecordTable";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // =========================================
  // Load all reviews for admin
  // =========================================
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/reviews/admin/all`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("admin");

          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch reviews"
          );
        }

        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Admin reviews error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [router]);

  // =========================================
  // Publish / Unpublish
  // =========================================
  const handlePublishToggle = async (review) => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      setActionLoading(review._id);
      setError("");
      setNotice("");

      const response = await fetch(
        `${API_URL}/reviews/${review._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to change review publication status"
        );
      }

      // Update the review immediately on the page
setNotice("Review publication status updated.");
      setReviews((currentReviews) =>
        currentReviews.map((item) =>
          item._id === review._id
            ? data.review || {
              ...item,
              isPublished: !item.isPublished,
            }
            : item
        )
      );
    } catch (error) {
      console.error("Publish review error:", error);
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================
  // Delete Review
  // =========================================
  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      setActionLoading(reviewId);
      setError("");
      setNotice("");

      const response = await fetch(
        `${API_URL}/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete review"
        );
      }

setNotice("Review deleted successfully.");
      setReviews((currentReviews) =>
        currentReviews.filter(
          (review) => review._id !== reviewId
        )
      );
    } catch (error) {
      console.error("Delete review error:", error);
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================
  // Loading
  // =========================================
  if (loading) {
    return (
      <main className="admin-reviews-page">
        <div className="admin-reviews-container">
          <p role="status" aria-live="polite">Loading reviews...</p>
        </div>
      </main>
    );
  }

  // =========================================
  // Page
  // =========================================
  return (
    <main className="admin-reviews-page">
{notice && <div className="admin-success" role="status">{notice}</div>}
      <div className="admin-reviews-container">

        {/* Header */}
        <div className="admin-reviews-header">
          <div>
            <p className="admin-reviews-label">
              REVIEW MANAGEMENT
            </p>

            <h1>Reviews</h1>

            <p>
              Create, edit, publish and manage your
              software reviews.
            </p>
          </div>

          <div className="admin-reviews-header-actions">

            <Link
              href="/admin/reviews/new"
              className="admin-primary-button"
            >
              + New Review
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-error-message" role="alert">
            {error}
          </div>
        )}

        {/* Empty State */}
        {reviews.length === 0 ? (
          <div className="admin-reviews-empty">
            <h2>No reviews yet</h2>

            <p>
              Create your first software review to
              get started.
            </p>

            <Link
              href="/admin/reviews/new"
              className="admin-primary-button"
            >
              Create Review
            </Link>
          </div>
        ) : (
          <AdminRecordTable label="Reviews" records={reviews} columns={[{label:'Review',render:review=><><strong>{review.title}</strong><p className="admin-table-description">{review.excerpt}</p>By {review.author || 'SaaSpin Team'} ? {review.readTime || 5} min read</>},{label:'Product',render:review=><>{review.product?.logo && <img src={review.product.logo} alt={review.product?.name || 'Product'} />}<br />{review.product?.name || 'Unknown Product'}<br />{review.product?.category?.name || 'Software'}</>},{label:'Rating',render:review=><>{review.overallRating}/5</>},{label:'Status',render:review=><AdminStatus status={review.isPublished ? 'Published' : 'Draft'} />}]} renderActions={(review) => (<div className="admin-review-actions">

                  <Link
                    href={`/admin/reviews/${review._id}/edit`}
                    className="admin-secondary-button"
                  >
                    Edit
                  </Link>

                  {review.isPublished && review.slug && (
                    <Link
                      href={`/reviews/${review.slug}`}
                      className="admin-secondary-button"
                    >
                      View
                    </Link>
                  )}

                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() =>
                      handlePublishToggle(review)
                    }
                    disabled={
                      actionLoading === review._id
                    }
                  >
                    {actionLoading === review._id
                      ? "Updating..."
                      : review.isPublished
                        ? "Unpublish"
                        : "Publish"}
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() =>
                      handleDelete(review._id)
                    }
                    disabled={
                      actionLoading === review._id
                    }
                  >
                    Delete
                  </button>

                </div>)} />
        )}
      </div>
    </main>
  );
}