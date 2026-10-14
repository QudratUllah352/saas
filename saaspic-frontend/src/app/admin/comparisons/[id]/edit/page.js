"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditComparisonPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",

    productA: "",
    productB: "",

    excerpt: "",
    introduction: "",

    productABestFor: "",
    productBBestFor: "",

    productAStrengths: "",
    productBStrengths: "",

    productALimitations: "",
    productBLimitations: "",

    conclusion: "",

    author: "SaaSpin Team",
    readTime: 5,
  });

  const [comparisonPoints, setComparisonPoints] =
    useState([
      {
        title: "",
        productA: "",
        productB: "",
      },
    ]);

  // ==========================================
  // LOAD PRODUCTS + COMPARISON
  // ==========================================

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("adminToken");

        if (!token) {
          router.push("/login");
          return;
        }

        const [
          productsResponse,
          comparisonResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/products`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/comparisons/admin/${id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: "no-store",
            }
          ),
        ]);

        if (
          comparisonResponse.status === 401 ||
          comparisonResponse.status === 403
        ) {
          localStorage.removeItem(
            "adminToken"
          );

          localStorage.removeItem(
            "admin"
          );

          router.push("/login");
          return;
        }

        if (!productsResponse.ok) {
          throw new Error(
            "Could not load products."
          );
        }

        if (!comparisonResponse.ok) {
          const errorData =
            await comparisonResponse.json();

          throw new Error(
            errorData.message ||
              "Could not load comparison."
          );
        }

        const productsData =
          await productsResponse.json();

        const comparison =
          await comparisonResponse.json();

        setProducts(productsData);

        setForm({
          title:
            comparison.title || "",

          slug:
            comparison.slug || "",

          productA:
            comparison.productA?._id ||
            comparison.productA ||
            "",

          productB:
            comparison.productB?._id ||
            comparison.productB ||
            "",

          excerpt:
            comparison.excerpt || "",

          introduction:
            comparison.introduction || "",

          productABestFor:
            Array.isArray(
              comparison.productABestFor
            )
              ? comparison.productABestFor.join(
                  ", "
                )
              : "",

          productBBestFor:
            Array.isArray(
              comparison.productBBestFor
            )
              ? comparison.productBBestFor.join(
                  ", "
                )
              : "",

          productAStrengths:
            Array.isArray(
              comparison.productAStrengths
            )
              ? comparison.productAStrengths.join(
                  ", "
                )
              : "",

          productBStrengths:
            Array.isArray(
              comparison.productBStrengths
            )
              ? comparison.productBStrengths.join(
                  ", "
                )
              : "",

          productALimitations:
            Array.isArray(
              comparison.productALimitations
            )
              ? comparison.productALimitations.join(
                  ", "
                )
              : "",

          productBLimitations:
            Array.isArray(
              comparison.productBLimitations
            )
              ? comparison.productBLimitations.join(
                  ", "
                )
              : "",

          conclusion:
            comparison.conclusion || "",

          author:
            comparison.author ||
            "SaaSpin Team",

          readTime:
            comparison.readTime || 5,
        });

        if (
          Array.isArray(
            comparison.comparisonPoints
          ) &&
          comparison.comparisonPoints.length >
            0
        ) {
          setComparisonPoints(
            comparison.comparisonPoints.map(
              (point) => ({
                title:
                  point.title || "",

                productA:
                  point.productA || "",

                productB:
                  point.productB || "",
              })
            )
          );
        }
      } catch (error) {
        console.error(error);

        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPage();
    }
  }, [id, router]);

  // ==========================================
  // INPUT
  // ==========================================

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function textToArray(value) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // ==========================================
  // COMPARISON POINTS
  // ==========================================

  function handlePointChange(
    index,
    field,
    value
  ) {
    setComparisonPoints((previous) =>
      previous.map(
        (point, pointIndex) =>
          pointIndex === index
            ? {
                ...point,
                [field]: value,
              }
            : point
      )
    );
  }

  function addComparisonPoint() {
    setComparisonPoints((previous) => [
      ...previous,

      {
        title: "",
        productA: "",
        productB: "",
      },
    ]);
  }

  function removeComparisonPoint(index) {
    setComparisonPoints((previous) =>
      previous.filter(
        (_, pointIndex) =>
          pointIndex !== index
      )
    );
  }

  // ==========================================
  // AI REGENERATE
  // ==========================================

  async function generateWithAI() {
    try {
      setGeneratingAI(true);
      setError("");
      setMessage("");

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!form.productA || !form.productB) {
        throw new Error(
          "Please select both products."
        );
      }

      if (form.productA === form.productB) {
        throw new Error(
          "Please select two different products."
        );
      }

      const confirmed = window.confirm(
        "AI generation will replace the current comparison content. Continue?"
      );

      if (!confirmed) {
        return;
      }

      const response = await fetch(
        `${API_URL}/ai/comparisons/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            productAId: form.productA,
            productBId: form.productB,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not generate comparison."
        );
      }

      const generated =
        data.comparison;

      if (!generated) {
        throw new Error(
          "AI did not return comparison data."
        );
      }

      setForm((previous) => ({
        ...previous,

        title:
          generated.title ||
          previous.title,

        slug:
          generated.slug ||
          previous.slug,

        excerpt:
          generated.excerpt || "",

        introduction:
          generated.introduction || "",

        productABestFor:
          Array.isArray(
            generated.productABestFor
          )
            ? generated.productABestFor.join(
                ", "
              )
            : "",

        productBBestFor:
          Array.isArray(
            generated.productBBestFor
          )
            ? generated.productBBestFor.join(
                ", "
              )
            : "",

        productAStrengths:
          Array.isArray(
            generated.productAStrengths
          )
            ? generated.productAStrengths.join(
                ", "
              )
            : "",

        productBStrengths:
          Array.isArray(
            generated.productBStrengths
          )
            ? generated.productBStrengths.join(
                ", "
              )
            : "",

        productALimitations:
          Array.isArray(
            generated.productALimitations
          )
            ? generated.productALimitations.join(
                ", "
              )
            : "",

        productBLimitations:
          Array.isArray(
            generated.productBLimitations
          )
            ? generated.productBLimitations.join(
                ", "
              )
            : "",

        conclusion:
          generated.conclusion || "",

        readTime:
          Number(
            generated.readTime
          ) || 5,
      }));

      if (
        Array.isArray(
          generated.comparisonPoints
        ) &&
        generated.comparisonPoints.length >
          0
      ) {
        setComparisonPoints(
          generated.comparisonPoints.map(
            (point) => ({
              title:
                point?.title || "",

              productA:
                point?.productA || "",

              productB:
                point?.productB || "",
            })
          )
        );
      }

      setMessage(
        `AI comparison generated${
          data.model
            ? ` using ${data.model}`
            : ""
        }. Review the new content and click Save Changes.`
      );
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setGeneratingAI(false);
    }
  }

  // ==========================================
  // SAVE UPDATE
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        router.push("/login");
        return;
      }

      if (form.productA === form.productB) {
        throw new Error(
          "Product A and Product B must be different."
        );
      }

      const cleanPoints =
        comparisonPoints
          .filter(
            (point) =>
              point.title.trim() &&
              point.productA.trim() &&
              point.productB.trim()
          )
          .map((point) => ({
            title:
              point.title.trim(),

            productA:
              point.productA.trim(),

            productB:
              point.productB.trim(),
          }));

      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),

        productA: form.productA,
        productB: form.productB,

        excerpt:
          form.excerpt.trim(),

        introduction:
          form.introduction.trim(),

        comparisonPoints:
          cleanPoints,

        productABestFor:
          textToArray(
            form.productABestFor
          ),

        productBBestFor:
          textToArray(
            form.productBBestFor
          ),

        productAStrengths:
          textToArray(
            form.productAStrengths
          ),

        productBStrengths:
          textToArray(
            form.productBStrengths
          ),

        productALimitations:
          textToArray(
            form.productALimitations
          ),

        productBLimitations:
          textToArray(
            form.productBLimitations
          ),

        conclusion:
          form.conclusion.trim(),

        author:
          form.author.trim() ||
          "SaaSpin Team",

        readTime:
          Number(form.readTime) || 5,
      };

      const response = await fetch(
        `${API_URL}/comparisons/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not update comparison."
        );
      }

      setMessage(
        "Comparison updated successfully."
      );

      router.push(
        "/admin/comparisons"
      );
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="admin-reviews-page">
        <div className="admin-reviews-container">
          <p role="status" aria-live="polite">Loading comparison...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="admin-reviews-page">

      <div className="admin-reviews-container">

        <div className="admin-reviews-header">

          <div>
            <span className="admin-reviews-label">
              ADMIN
            </span>

            <h1>Edit Comparison</h1>

            <p>
              Update the comparison manually
              or regenerate its content with AI.
            </p>
          </div>

          <Link
            href="/admin/comparisons"
            className="admin-secondary-button"
          >
            ← Back
          </Link>

        </div>

        {error && (
          <div className="admin-error-message" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="admin-ai-message" role="status" aria-live="polite">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="admin-review-form"
        >

          {/* BASIC */}

          <section className="admin-form-section">

            <h2>Basic Information</h2>

            <label>
              Title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Slug
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Excerpt
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows="3"
                required
              />
            </label>

          </section>

          {/* PRODUCTS */}

          <section className="admin-form-section">

            <h2>Products</h2>

            <div className="comparison-product-selectors">

              <label>
                Product A

                <select
                  name="productA"
                  value={form.productA}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product._id}
                        value={product._id}
                      >
                        {product.name}
                      </option>
                    )
                  )}

                </select>
              </label>

              <div className="comparison-vs">
                VS
              </div>

              <label>
                Product B

                <select
                  name="productB"
                  value={form.productB}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product._id}
                        value={product._id}
                      >
                        {product.name}
                      </option>
                    )
                  )}

                </select>
              </label>

            </div>

            <div className="admin-ai-assistant-card">
              <div className="admin-ai-assistant-header">
                <div className="admin-ai-badge">
                  <span className="admin-ai-sparkle">✨</span>
                  <span>GEMINI AI COMPARISON WRITER</span>
                </div>
                <span className="admin-ai-notice">
                  Draft remains fully editable &bull; Never auto-publishes
                </span>
              </div>
              <div className="admin-ai-assistant-body">
                <div className="admin-ai-assistant-info">
                  <h3>Regenerate Head-to-Head Comparison</h3>
                  <p>
                    Re-analyze Product A and Product B specifications to generate comparison points, introduction, strengths, limitations, and verdict.
                    Review and modify before saving.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-ai-action-btn"
                  onClick={generateWithAI}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <>
                      <span className="admin-spinner" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Regenerate with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </section>

          {/* INTRODUCTION */}

          <section className="admin-form-section">

            <h2>Introduction</h2>

            <textarea
              name="introduction"
              value={form.introduction}
              onChange={handleChange}
              rows="7"
              required
            />

          </section>

          {/* COMPARISON POINTS */}

          <section className="admin-form-section">

            <h2>Comparison Points</h2>

            {comparisonPoints.map(
              (point, index) => (
                <div
                  key={index}
                  className="comparison-point-editor"
                >

                  <input
                    value={point.title}
                    placeholder="Comparison point"
                    onChange={(event) =>
                      handlePointChange(
                        index,
                        "title",
                        event.target.value
                      )
                    }
                  />

                  <input
                    value={point.productA}
                    placeholder="Product A"
                    onChange={(event) =>
                      handlePointChange(
                        index,
                        "productA",
                        event.target.value
                      )
                    }
                  />

                  <input
                    value={point.productB}
                    placeholder="Product B"
                    onChange={(event) =>
                      handlePointChange(
                        index,
                        "productB",
                        event.target.value
                      )
                    }
                  />

                  {comparisonPoints.length >
                    1 && (
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        removeComparisonPoint(
                          index
                        )
                      }
                    >
                      Remove
                    </button>
                  )}

                </div>
              )
            )}

            <button
              type="button"
              className="admin-secondary-button"
              onClick={addComparisonPoint}
            >
              + Add Comparison Point
            </button>

          </section>

          {/* BEST FOR */}

          <section className="admin-form-section">

            <h2>Best For</h2>

            <label>
              Product A Best For
              <textarea
                name="productABestFor"
                value={form.productABestFor}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <label>
              Product B Best For
              <textarea
                name="productBBestFor"
                value={form.productBBestFor}
                onChange={handleChange}
                rows="3"
              />
            </label>

          </section>

          {/* STRENGTHS */}

          <section className="admin-form-section">

            <h2>Strengths</h2>

            <label>
              Product A Strengths
              <textarea
                name="productAStrengths"
                value={form.productAStrengths}
                onChange={handleChange}
                rows="4"
              />
            </label>

            <label>
              Product B Strengths
              <textarea
                name="productBStrengths"
                value={form.productBStrengths}
                onChange={handleChange}
                rows="4"
              />
            </label>

          </section>

          {/* LIMITATIONS */}

          <section className="admin-form-section">

            <h2>Limitations</h2>

            <label>
              Product A Limitations
              <textarea
                name="productALimitations"
                value={form.productALimitations}
                onChange={handleChange}
                rows="4"
              />
            </label>

            <label>
              Product B Limitations
              <textarea
                name="productBLimitations"
                value={form.productBLimitations}
                onChange={handleChange}
                rows="4"
              />
            </label>

          </section>

          {/* CONCLUSION */}

          <section className="admin-form-section">

            <h2>Conclusion</h2>

            <textarea
              name="conclusion"
              value={form.conclusion}
              onChange={handleChange}
              rows="8"
              required
            />

          </section>

          {/* PUBLISHING INFO */}

          <section className="admin-form-section">

            <h2>Publishing Information</h2>

            <label>
              Author
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
              />
            </label>

            <label>
              Read Time
              <input
                type="number"
                name="readTime"
                value={form.readTime}
                onChange={handleChange}
                min="1"
              />
            </label>

          </section>

          {/* ACTIONS */}

          <div className="admin-form-actions">

            <Link
              href="/admin/comparisons"
              className="admin-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={
                saving || generatingAI
              }
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}