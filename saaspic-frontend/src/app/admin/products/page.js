"use client";

import AdminRecordTable from "@/components/AdminRecordTable";

import { API_URL as API } from "@/lib/api";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ============================================
  // LOAD PRODUCTS
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");
      setNotice("");

        const response = await fetch(`${API}/products`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load products.");
        }

        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);

        setError(error.message || "Could not load products.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [router]);

  // ============================================
  // DELETE PRODUCT
  // ============================================

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setDeletingId(product._id);
      setError("");
      setNotice("");

      const response = await fetch(`${API}/products/${product._id}`, {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not delete product.");
      }

setNotice("Product deleted successfully.");
      setProducts((currentProducts) =>
        currentProducts.filter((item) => item._id !== product._id),
      );
    } catch (error) {
      console.error(error);

      setError(error.message || "Could not delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="admin-products-page">
        <div className="admin-products-container">
          <p role="status" aria-live="polite">Loading products...</p>
        </div>
      </main>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="admin-products-page">
{notice && <div className="admin-success" role="status">{notice}</div>}
      <div className="admin-products-container">
        {/* HEADER */}

        <div className="admin-products-header">
          <div>
            <p className="admin-products-eyebrow">Admin Dashboard</p>

            <h1>Products</h1>

            <p>Manage the SaaS products used by deals and reviews.</p>
          </div>

          <div className="admin-products-header-actions">
            <Link href="/admin/products/new" className="admin-primary-button">
              + Add Product
            </Link>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="admin-products-error" role="alert">{error}</div>}

        {/* EMPTY */}

        {products.length === 0 ? (
          <div className="admin-products-empty">
            <h2>No products found</h2>

            <p>
              Add your first SaaS product to start creating deals and
              AI-assisted reviews.
            </p>

            <Link href="/admin/products/new" className="admin-primary-button">
              Add Product
            </Link>
          </div>
        ) : (
          <AdminRecordTable label="Products" records={products} columns={[{label:'Product',render:product=><><strong>{product.name}</strong><p className="admin-table-description">{product.shortDescription || product.description || 'No description available.'}</p>{product.logo && <img src={product.logo} alt={product.name + ' logo'} />}</>},{label:'Category',render:product=>product.category?.name || 'Uncategorized'},{label:'Slug',render:product=>product.slug},{label:'Details',render:product=><>Features: {product.features?.length || 0}<br />Integrations: {product.integrations?.length || 0}</>},{label:'Website',render:product=>product.website && <a href={product.website} target="_blank" rel="noopener noreferrer">Visit website</a>}]} renderActions={(product) => (<div className="admin-product-actions">
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    className="admin-edit-button"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(product)}
                    disabled={deletingId === product._id}
                  >
                    {deletingId === product._id ? "Deleting..." : "Delete"}
                  </button>
                </div>)} />
        )}
      </div>
    </main>
  );
}
