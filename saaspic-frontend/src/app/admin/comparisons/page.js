"use client";

import AdminRecordTable, { AdminStatus } from "@/components/AdminRecordTable";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminComparisonsPage() {
  const router = useRouter();

  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workingId, setWorkingId] = useState(null);

  async function loadComparisons() {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/comparisons/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load comparisons."
        );
      }

      setComparisons(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComparisons();
  }, []);

  // ==========================================
  // PUBLISH / UNPUBLISH
  // ==========================================

  async function handleStatus(comparison) {
    try {
      setWorkingId(comparison._id);
      setError("");
      setNotice("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/comparisons/${comparison._id}/status`,
        {
          method: "PATCH",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not change comparison status."
        );
      }

      await loadComparisons();
      setNotice("Comparison publication status updated.");
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setWorkingId(null);
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  async function handleDelete(comparisonId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comparison?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(comparisonId);
      setError("");
      setNotice("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/comparisons/${comparisonId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not delete comparison."
        );
      }

      setNotice("Comparison deleted successfully.");
      setComparisons((previous) =>
        previous.filter(
          (comparison) =>
            comparison._id !== comparisonId
        )
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setWorkingId(null);
    }
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="admin-reviews-page">
{notice && <div className="admin-success" role="status">{notice}</div>}

      <div className="admin-reviews-container">

        <div className="admin-reviews-header">

          <div>
            <span className="admin-reviews-label">
              ADMIN
            </span>

            <h1>Comparisons</h1>

            <p>
              Create, edit, publish and manage SaaS
              product comparisons.
            </p>
          </div>

          <div className="admin-header-actions">

            <Link
              href="/admin/comparisons/new"
              className="admin-primary-button"
            >
              + New Comparison
            </Link>

          </div>

        </div>

        {error && (
          <div className="admin-error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p role="status" aria-live="polite">Loading comparisons...</p>
        ) : comparisons.length === 0 ? (

          <div className="admin-empty-state">

            <h3>No comparisons yet</h3>

            <p>
              Create your first software comparison.
            </p>

            <Link
              href="/admin/comparisons/new"
              className="admin-primary-button"
            >
              Create Comparison
            </Link>

          </div>

        ) : (

          <AdminRecordTable label="Comparisons" records={comparisons} columns={[{label:'Comparison',render:comparison=><><strong>{comparison.title}</strong><p className="admin-table-description">{comparison.excerpt}</p>{comparison.readTime || 5} min read</>},{label:'Products',render:comparison=><>{comparison.productA?.name || 'Product A'} vs {comparison.productB?.name || 'Product B'}</>},{label:'Status',render:comparison=><AdminStatus status={comparison.isPublished ? 'Published' : 'Draft'} />}]} renderActions={(comparison) => (<div className="admin-review-actions">

                    <Link
                      href={`/admin/comparisons/${comparison._id}/edit`}
                      className="admin-secondary-button"
                    >
                      Edit
                    </Link>

                    {comparison.isPublished && (
                      <Link
                        href={`/comparisons/${comparison.slug}`}
                        className="admin-secondary-button"
                        target="_blank"
                      >
                        View
                      </Link>
                    )}

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={() =>
                        handleStatus(comparison)
                      }
                      disabled={workingId === comparison._id}
                    >
                      {workingId === comparison._id
                        ? "Working..."
                        : comparison.isPublished
                          ? "Unpublish"
                          : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDelete(
                          comparison._id
                        )
                      }
                      disabled={workingId === comparison._id}
                    >
                      Delete
                    </button>

                  </div>)} />

        )}

      </div>

    </main>
  );
}
