"use client";

import { API_URL as API } from "@/lib/api";

import Link from "next/link";
import AdminProductAssistant from "@/components/AdminProductAssistant";
import { productArray } from "@/lib/productAISuggestions";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";


const initialForm = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  website: "",
  logo: "",
  category: "",
  features: "",
  targetAudience: "",
  integrations: "",
  pricingInfo: "",
  strengths: "",
  limitations: "",
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id;

  const [formData, setFormData] =
    useState(initialForm);

  const [categories, setCategories] =
    useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // ==========================================
  // LOAD PAGE
  // ==========================================

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!productId) {
      return;
    }

    loadPage(token);
  }, [productId, router]);

  // ==========================================
  // LOAD PRODUCT + CATEGORIES
  // ==========================================

  async function loadPage(token) {
    try {
      setPageLoading(true);
      setError("");

      const [
        productResponse,
        categoryResponse,
      ] = await Promise.all([
        fetch(
          `${API}/products/admin/${productId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
          }
        ),

        fetch(`${API}/categories`, {
          cache: "no-store",
        }),
      ]);

      if (
        productResponse.status === 401 ||
        productResponse.status === 403
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

      const product =
        await productResponse.json();

      const categoryData =
        await categoryResponse.json();

      if (!productResponse.ok) {
        throw new Error(
          product.message ||
            "Could not load product."
        );
      }

      if (!categoryResponse.ok) {
        throw new Error(
          categoryData.message ||
            "Could not load categories."
        );
      }

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );

      setFormData({
        name:
          product.name || "",

        slug:
          product.slug || "",

        description:
          product.description || "",

        shortDescription:
          product.shortDescription || "",

        website:
          product.website || "",

        logo:
          product.logo || "",

        category:
          product.category?._id ||
          product.category ||
          "",

        features:
          Array.isArray(product.features)
            ? product.features.join(", ")
            : "",

        targetAudience:
          Array.isArray(
            product.targetAudience
          )
            ? product.targetAudience.join(
                ", "
              )
            : "",

        integrations:
          Array.isArray(
            product.integrations
          )
            ? product.integrations.join(
                ", "
              )
            : "",

        pricingInfo:
          product.pricingInfo || "",

        strengths:
          Array.isArray(product.strengths)
            ? product.strengths.join(", ")
            : "",

        limitations:
          Array.isArray(
            product.limitations
          )
            ? product.limitations.join(
                ", "
              )
            : "",
      });
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Could not load product."
      );
    } finally {
      setPageLoading(false);
    }
  }

  // ==========================================
  // INPUT
  // ==========================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // ==========================================
  // STRING -> ARRAY
  // ==========================================

  function textToArray(value) {
    return productArray(value);
  }

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.description.trim() ||
      !formData.website.trim() ||
      !formData.category
    ) {
      setError(
        "Name, slug, description, website and category are required."
      );

      return;
    }

    const payload = {
      name:
        formData.name.trim(),

      slug:
        formData.slug.trim(),

      description:
        formData.description.trim(),

      shortDescription:
        formData.shortDescription.trim(),

      website:
        formData.website.trim(),

      logo:
        formData.logo.trim(),

      category:
        formData.category,

      features:
        textToArray(
          formData.features
        ),

      targetAudience:
        textToArray(
          formData.targetAudience
        ),

      integrations:
        textToArray(
          formData.integrations
        ),

      pricingInfo:
        formData.pricingInfo.trim(),

      strengths:
        textToArray(
          formData.strengths
        ),

      limitations:
        textToArray(
          formData.limitations
        ),
    };

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API}/products/${productId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(payload),
          }
        );

      const data =
        await response.json();

      if (
        response.status === 401 ||
        response.status === 403
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

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update product."
        );
      }

      setMessage(
        "Product updated successfully."
      );

      setTimeout(() => {
        router.push(
          "/admin/products"
        );
      }, 700);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Could not update product."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (pageLoading) {
    return (
      <main className="product-editor-page">
        <div className="product-editor-container">
          <p role="status" aria-live="polite">Loading product...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="product-editor-page">

      <div className="product-editor-container">

        <div className="product-editor-header">

          <div>
            <p className="product-editor-eyebrow">
              Product Management
            </p>

            <h1>Edit Product</h1>

            <p>
              Update the verified information
              stored for this SaaS product.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="admin-secondary-button"
          >
            ← Products
          </Link>

        </div>

        {error && (
          <div className="product-editor-error">
            {error}
          </div>
        )}

        {message && (
          <div className="product-editor-success">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="product-editor-form"
        >

          {/* BASIC INFORMATION */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>Basic Information</h2>

              <p>
                Main information about the
                SaaS product.
              </p>
            </div>

            <div className="product-form-grid">

              <div className="product-form-field">
                <label htmlFor="admin-field-name">
                  Product Name *
                </label>

                <input id="admin-field-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="product-form-field">
                <label htmlFor="admin-field-slug">
                  Slug *
                </label>

                <input id="admin-field-slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />

                <small>
                  Be careful when changing
                  an existing product slug.
                </small>
              </div>

              <div className="product-form-field">
                <label htmlFor="admin-field-category">
                  Category *
                </label>

                <select id="admin-field-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="product-form-field">
                <label htmlFor="admin-field-website">
                  Website *
                </label>

                <input id="admin-field-website"
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="product-form-field product-form-full">
                <label htmlFor="admin-field-logo">
                  Logo
                </label>

                <input id="admin-field-logo"
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="/images/products/product.png"
                />
              </div>

            </div>

          </section>

          {/* DESCRIPTION */}

          <AdminProductAssistant mode="edit" formData={formData} setFormData={setFormData} categories={categories} disabled={saving || pageLoading} />

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>Description</h2>

              <p>
                Explain what this product does.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-shortDescription">
                Short Description
              </label>

              <textarea id="admin-field-shortDescription"
                name="shortDescription"
                value={
                  formData.shortDescription
                }
                onChange={handleChange}
                rows="2"
              />
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-description">
                Full Description *
              </label>

              <textarea id="admin-field-description"
                name="description"
                value={
                  formData.description
                }
                onChange={handleChange}
                rows="5"
                required
              />
            </div>

          </section>

          {/* VERIFIED INFORMATION */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Verified Product Information
              </h2>

              <p>
                Gemini can use this information
                when generating review drafts.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-features">Features</label>

              <textarea id="admin-field-features"
                name="features"
                value={Array.isArray(formData.features) ? formData.features.join(", ") : formData.features}
                onChange={handleChange}
                rows="3"
                placeholder="Feature one, Feature two, Feature three"
              />

              <small>
                Separate items with commas.
              </small>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-targetAudience">
                Target Audience
              </label>

              <textarea id="admin-field-targetAudience"
                name="targetAudience"
                value={Array.isArray(formData.targetAudience) ? formData.targetAudience.join(", ") : formData.targetAudience}
                onChange={handleChange}
                rows="3"
                placeholder="Freelancers, Small businesses, Marketing teams"
              />
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-integrations">
                Integrations
              </label>

              <textarea id="admin-field-integrations"
                name="integrations"
                value={Array.isArray(formData.integrations) ? formData.integrations.join(", ") : formData.integrations}
                onChange={handleChange}
                rows="3"
                placeholder="Slack, Zapier, WordPress"
              />
            </div>

          </section>

          {/* PRICING */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Pricing Information
              </h2>

              <p>
                Store regular verified pricing.
                Temporary offers remain in Deals.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-pricingInfo">Pricing</label>

              <textarea id="admin-field-pricingInfo"
                name="pricingInfo"
                value={
                  formData.pricingInfo
                }
                onChange={handleChange}
                rows="4"
                placeholder="Example: Plans start at $19/month."
              />
            </div>

          </section>

          {/* EDITORIAL */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Editorial Information
              </h2>

              <p>
                Add supported strengths and
                limitations for review drafting.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-strengths">Strengths</label>

              <textarea id="admin-field-strengths"
                name="strengths"
                value={Array.isArray(formData.strengths) ? formData.strengths.join(", ") : formData.strengths}
                onChange={handleChange}
                rows="3"
                placeholder="Easy to use, Fast workflow"
              />
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-limitations">Limitations</label>

              <textarea id="admin-field-limitations"
                name="limitations"
                value={Array.isArray(formData.limitations) ? formData.limitations.join(", ") : formData.limitations}
                onChange={handleChange}
                rows="3"
                placeholder="Limited customization, No verified integration data"
              />
            </div>

          </section>

          {/* SAVE */}

          <div className="product-editor-actions">

            <Link
              href="/admin/products"
              className="admin-secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
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