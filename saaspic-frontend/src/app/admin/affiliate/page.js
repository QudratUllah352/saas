"use client";

import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptyForm = {
  enabled: false,
  url: "",
  programName: "",
  network: "",
  commissionType: "unknown",
  commissionValue: "",
  disclosureText: "",
};

function formatSource(source) {
  if (!source) return "Other";

  return (
    source.charAt(0).toUpperCase() +
    source.slice(1)
  );
}

function getSourceIcon(source) {
  switch (source) {
    case "deal":
      return "D";
    case "review":
      return "R";
    case "comparison":
      return "C";
    case "blog":
      return "B";
    case "homepage":
      return "H";
    case "search":
      return "S";
    default:
      return "O";
  }
}

export default function AffiliateAdminPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [form, setForm] = useState(emptyForm);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearAdminSession() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
  }

  function selectProduct(
    product,
    clearMessages = true
  ) {
    setSelectedProductId(product._id);

    const affiliate = product.affiliate || {};

    setForm({
      enabled: affiliate.enabled || false,
      url: affiliate.url || "",
      programName: affiliate.programName || "",
      network: affiliate.network || "",
      commissionType:
        affiliate.commissionType || "unknown",
      commissionValue:
        affiliate.commissionValue || "",
      disclosureText:
        affiliate.disclosureText || "",
    });

    if (clearMessages) {
      setMessage("");
      setError("");
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (form.enabled && !form.url.trim()) {
      setError(
        "Affiliate URL is required when affiliate marketing is enabled."
      );
      return;
    }

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      clearAdminSession();
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_URL}/affiliate/admin/products/${selectedProductId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(form),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearAdminSession();
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not save affiliate settings."
        );
      }

      setProducts((current) =>
        current.map((product) =>
          product._id === selectedProductId
            ? data.product
            : product
        )
      );

      setMessage(
        "Affiliate settings saved successfully."
      );
    } catch (err) {
      console.error(
        "Affiliate save error:",
        err
      );

      setError(
        err.message ||
          "Could not save affiliate settings."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function loadPage() {
      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        clearAdminSession();
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          productsResponse,
          statsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/affiliate/admin/products`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/affiliate/stats`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),
        ]);

        const authFailed =
          productsResponse.status === 401 ||
          productsResponse.status === 403 ||
          statsResponse.status === 401 ||
          statsResponse.status === 403;

        if (authFailed) {
          clearAdminSession();
          router.push("/login");
          return;
        }

        if (!productsResponse.ok) {
          throw new Error(
            "Could not load affiliate products."
          );
        }

        if (!statsResponse.ok) {
          throw new Error(
            "Could not load affiliate statistics."
          );
        }

        const [
          productsData,
          statsData,
        ] = await Promise.all([
          productsResponse.json(),
          statsResponse.json(),
        ]);

        const safeProducts =
          Array.isArray(productsData)
            ? productsData
            : [];

        setProducts(safeProducts);
        setStats(statsData);

        if (safeProducts.length > 0) {
          selectProduct(
            safeProducts[0],
            false
          );
        }
      } catch (err) {
        console.error(
          "Affiliate page error:",
          err
        );

        setError(
          err.message ||
            "Could not load affiliate management."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router]);

  if (loading) {
    return (
      <main className="affiliate-admin-page">
        <div className="affiliate-admin-container">
          <p>
            Loading affiliate management...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="affiliate-admin-page">
      <div className="affiliate-admin-container">

        {/* HEADER */}

        <div className="affiliate-admin-header">
          <div>
            <span className="affiliate-admin-eyebrow">
              MONETIZATION
            </span>

            <h1>Affiliate Management</h1>

            <p>
              Manage affiliate programs,
              tracking links and commission
              information for SaaSpin products.
            </p>
          </div>
        </div>

        {/* STATS */}

        <div className="affiliate-stat-grid">
          <div className="affiliate-stat-card">
            <span>
              Total Affiliate Clicks
            </span>

            <strong>
              {stats?.totalClicks || 0}
            </strong>
          </div>

          <div className="affiliate-stat-card">
            <span>
              Affiliate Products
            </span>

            <strong>
              {
                products.filter(
                  (product) =>
                    product.affiliate?.enabled
                ).length
              }
            </strong>
          </div>

          <div className="affiliate-stat-card">
            <span>Products</span>

            <strong>
              {products.length}
            </strong>
          </div>
        </div>

        <div className="affiliate-admin-layout">

          {/* PRODUCT LIST */}

          <aside className="affiliate-product-panel">
            <h2>Products</h2>

            <div className="affiliate-product-list">
              {products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  className={
                    selectedProductId ===
                    product._id
                      ? "affiliate-product-item active"
                      : "affiliate-product-item"
                  }
                  onClick={() =>
                    selectProduct(product)
                  }
                >
                  <div>
                    <strong>
                      {product.name}
                    </strong>

                    <small>
                      {product.affiliate?.enabled
                        ? "Affiliate enabled"
                        : "Not enabled"}
                    </small>
                  </div>

                  <span
                    className={
                      product.affiliate?.enabled
                        ? "affiliate-status enabled"
                        : "affiliate-status"
                    }
                  />
                </button>
              ))}
            </div>
          </aside>

          {/* FORM */}

          <section className="affiliate-form-panel">
            <div className="affiliate-form-heading">
              <div>
                <span>
                  AFFILIATE SETTINGS
                </span>

                <h2>
                  {products.find(
                    (product) =>
                      product._id ===
                      selectedProductId
                  )?.name ||
                    "Select Product"}
                </h2>
              </div>
            </div>

            {error && (
              <div className="affiliate-error">
                {error}
              </div>
            )}

            {message && (
              <div className="affiliate-success">
                {message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="affiliate-form"
            >
              <label className="affiliate-toggle-row">
                <div>
                  <strong>
                    Enable Affiliate Link
                  </strong>

                  <span>
                    Visitors can use the
                    affiliate redirect for this
                    product.
                  </span>
                </div>

                <input
                  type="checkbox"
                  name="enabled"
                  checked={form.enabled}
                  onChange={handleChange}
                />
              </label>

              <div className="affiliate-form-group">
                <label htmlFor="admin-field-url">
                  Affiliate URL
                </label>

                <input id="admin-field-url"
                  type="url"
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://example.com/?ref=your-id"
                />

                <small>
                  Use the tracking URL supplied
                  by the affiliate program.
                </small>
              </div>

              <div className="affiliate-form-row">
                <div className="affiliate-form-group">
                  <label htmlFor="admin-field-programName">
                    Program Name
                  </label>

                  <input id="admin-field-programName"
                    type="text"
                    name="programName"
                    value={form.programName}
                    onChange={handleChange}
                    placeholder="Example Partner Program"
                  />
                </div>

                <div className="affiliate-form-group">
                  <label htmlFor="admin-field-network">
                    Network
                  </label>

                  <input id="admin-field-network"
                    type="text"
                    name="network"
                    value={form.network}
                    onChange={handleChange}
                    placeholder="Direct / Partner network"
                  />
                </div>
              </div>

              <div className="affiliate-form-row">
                <div className="affiliate-form-group">
                  <label htmlFor="admin-field-commissionType">
                    Commission Type
                  </label>

                  <select id="admin-field-commissionType"
                    name="commissionType"
                    value={
                      form.commissionType
                    }
                    onChange={handleChange}
                  >
                    <option value="unknown">
                      Unknown
                    </option>

                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed
                    </option>

                    <option value="recurring">
                      Recurring
                    </option>
                  </select>
                </div>

                <div className="affiliate-form-group">
                  <label htmlFor="admin-field-commissionValue">
                    Commission
                  </label>

                  <input id="admin-field-commissionValue"
                    type="text"
                    name="commissionValue"
                    value={
                      form.commissionValue
                    }
                    onChange={handleChange}
                    placeholder="Example: 20% recurring"
                  />
                </div>
              </div>

              <div className="affiliate-form-group">
                <label htmlFor="admin-field-disclosureText">
                  Disclosure Text
                </label>

                <textarea id="admin-field-disclosureText"
                  name="disclosureText"
                  value={
                    form.disclosureText
                  }
                  onChange={handleChange}
                  rows="4"
                  placeholder="SaaSpin may earn a commission if you purchase through this link."
                />
              </div>

              <div className="affiliate-form-actions">
                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Affiliate Settings"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* AFFILIATE ANALYTICS */}

      <div className="affiliate-analytics">
        <div className="affiliate-analytics-header">
          <div>
            <span>
              AFFILIATE ANALYTICS
            </span>

            <h2>
              Click Performance
            </h2>

            <p>
              See which products and content
              sources generate affiliate clicks.
            </p>
          </div>
        </div>

        <div className="affiliate-analytics-grid">

          {/* CLICKS BY PRODUCT */}

          <section className="affiliate-analytics-card">
            <div className="affiliate-analytics-card-header">
              <div>
                <span>
                  PRODUCT PERFORMANCE
                </span>

                <h3>
                  Clicks by Product
                </h3>
              </div>

              <strong>
                {stats?.totalClicks || 0}
              </strong>
            </div>

            {stats?.clicksByProduct?.length >
            0 ? (
              <div className="affiliate-analytics-list">
                {stats.clicksByProduct.map(
                  (item, index) => {
                    const maxClicks =
                      Math.max(
                        ...stats.clicksByProduct.map(
                          (product) =>
                            product.clicks || 0
                        ),
                        1
                      );

                    const percentage =
                      ((item.clicks || 0) /
                        maxClicks) *
                      100;

                    return (
                      <div
                        className="affiliate-analytics-row"
                        key={
                          item.productId ||
                          item._id ||
                          index
                        }
                      >
                        <div className="affiliate-analytics-row-top">
                          <div>
                            <span className="affiliate-rank">
                              {index + 1}
                            </span>

                            <strong>
                              {item.name ||
                                item.productName ||
                                "Unknown Product"}
                            </strong>
                          </div>

                          <span className="affiliate-click-count">
                            {item.clicks || 0}{" "}
                            clicks
                          </span>
                        </div>

                        <div className="affiliate-progress">
                          <div
                            className="affiliate-progress-bar"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="affiliate-empty-analytics">
                <strong>
                  No product clicks yet
                </strong>

                <p>
                  Affiliate clicks will
                  appear here after visitors
                  use your affiliate buttons.
                </p>
              </div>
            )}
          </section>

          {/* CLICKS BY SOURCE */}

          <section className="affiliate-analytics-card">
            <div className="affiliate-analytics-card-header">
              <div>
                <span>
                  TRAFFIC SOURCE
                </span>

                <h3>
                  Clicks by Source
                </h3>
              </div>
            </div>

            {stats?.clicksBySource?.length >
            0 ? (
              <div className="affiliate-source-list">
                {stats.clicksBySource.map(
                  (item, index) => (
                    <div
                      className="affiliate-source-row"
                      key={
                        item.source ||
                        item._id ||
                        index
                      }
                    >
                      <div className="affiliate-source-name">
                        <span className="affiliate-source-icon">
                          {getSourceIcon(
                            item.source ||
                              item._id
                          )}
                        </span>

                        <div>
                          <strong>
                            {formatSource(
                              item.source ||
                                item._id
                            )}
                          </strong>

                          <small>
                            Affiliate traffic
                          </small>
                        </div>
                      </div>

                      <strong className="affiliate-source-clicks">
                        {item.clicks ||
                          item.count ||
                          0}
                      </strong>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="affiliate-empty-analytics">
                <strong>
                  No source data yet
                </strong>

                <p>
                  Deal, review, comparison and
                  blog clicks will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}