"use client";

import AdminRecordTable, { AdminStatus } from "@/components/AdminRecordTable";

import { API_URL } from "@/lib/api";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminBlogsPage() {
  const router = useRouter();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  async function loadBlogs() {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/blogs/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load blogs.");
      }

      setBlogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePublish(blog) {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setActionLoading(blog._id);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/blogs/${blog._id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not change blog status.");
      }

      setMessage(data.message);
      await loadBlogs();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteBlog(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog?",
    );

    if (!confirmed) return;

    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setActionLoading(id);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete blog.");
      }

      setMessage(data.message);
      await loadBlogs();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p role="status" aria-live="polite">Loading blogs...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Content Management</p>
          <h1>Blogs</h1>
          <p>Manage SaaSpin blog articles.</p>
        </div>

        <div className="admin-header-actions">
          <Link href="/admin/blogs/new" className="admin-primary-button">
            + New Blog
          </Link>
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {message && <div className="admin-message" role="status">{message}</div>}

      {blogs.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No blogs yet</h2>
          <p>Create your first SaaSpin blog article.</p>

          <Link href="/admin/blogs/new" className="admin-primary-button">
            Create Blog
          </Link>
        </div>
      ) : (
        <AdminRecordTable label="Blogs" records={blogs} columns={[{label:'Article',render:blog=><><strong>{blog.title}</strong><p className="admin-table-description">{blog.excerpt}</p>{blog.readTime || 5} min read{blog.relatedProducts?.length > 0 && <p className="admin-table-description">Related: {blog.relatedProducts.map(product=>product.name).join(', ')}</p>}</>},{label:'Category',render:blog=>blog.category || 'SaaS'},{label:'Status',render:blog=><AdminStatus status={blog.isPublished ? 'Published' : 'Draft'} />}]} renderActions={(blog) => (<div className="admin-review-actions">
                <Link
                  href={`/admin/blogs/${blog._id}/edit`}
                  className="admin-secondary-button"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={actionLoading === blog._id}
                  onClick={() => togglePublish(blog)}
                >
                  {actionLoading === blog._id
                    ? "Working..."
                    : blog.isPublished
                      ? "Unpublish"
                      : "Publish"}
                </button>

                {blog.isPublished && (
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="admin-secondary-button"
                    target="_blank"
                  >
                    View
                  </Link>
                )}

                <button
                  type="button"
                  className="admin-danger-button"
                  disabled={actionLoading === blog._id}
                  onClick={() => deleteBlog(blog._id)}
                >
                  Delete
                </button>
              </div>)} />
      )}
    </main>
  );
}
