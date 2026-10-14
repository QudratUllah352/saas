"use client";

import { API_URL as API } from "@/lib/api";

import Link from "next/link";
import AdminProductAssistant from "@/components/AdminProductAssistant";
import { productArray } from "@/lib/productAISuggestions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


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

export default function NewProductPage() {
  const router = useRouter();

  const [formData, setFormData] =
    useState(initialForm);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // ==========================================
  // CHECK AUTH + LOAD CATEGORIES
  // ==========================================

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      router.push("/login");
      return;
    }

    loadCategories();
  }, [router]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);

      const response =
        await fetch(`${API}/categories`, {
          cache: "no-store",
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not load categories."
        );
      }

      setCategories(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingCategories(false);
    }
  }

  // ==========================================
  // CREATE SLUG
  // ==========================================

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      // Automatically generate slug from name
      if (name === "name") {
        updated.slug =
          createSlug(value);
      }

      return updated;
    });
  }

  // ==========================================
  // STRING -> ARRAY
  // ==========================================

  function textToArray(value) {
    return productArray(value);
  }

  // ==========================================
  // SUBMIT
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
      setLoading(true);

      const response =
        await fetch(`${API}/products`, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify(payload),
        });

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
            "Could not create product."
        );
      }

      setMessage(
        "Product created successfully."
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
          "Could not create product."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="product-editor-page">

      <div className="product-editor-container">

        {/* HEADER */}

        <div className="product-editor-header">

          <div>
            <p className="product-editor-eyebrow">
              Product Management
            </p>

            <h1>Add Product</h1>

            <p>
              Add verified product information
              that can later be used for deals
              and AI-assisted reviews.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="admin-secondary-button"
          >
            ← Products
          </Link>

        </div>

        {/* ERROR */}

        {error && (
          <div className="product-editor-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="product-editor-success">
            {message}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="product-editor-form"
        >

          {/* BASIC INFORMATION */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Basic Information
              </h2>

              <p>
                Core information used
                throughout the website.
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
                  placeholder="Example: AI Writer"
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
                  placeholder="ai-writer"
                  required
                />

                <small>
                  Automatically generated
                  from the product name.
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
                  disabled={
                    loadingCategories
                  }
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
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
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div className="product-form-field product-form-full">
                <label htmlFor="admin-field-logo">
                  Logo URL
                </label>

                <input id="admin-field-logo"
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="/images/products/product.png"
                />

                <small>
                  You can use a local path such
                  as /images/products/ai-writer.png
                  or an external image URL.
                </small>
              </div>

            </div>

          </section>

          {/* DESCRIPTION */}

          <AdminProductAssistant formData={formData} setFormData={setFormData} categories={categories} disabled={loading || loadingCategories} />

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>Description</h2>

              <p>
                Explain what the product
                actually does.
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
                placeholder="A short summary for product cards."
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
                placeholder="Describe the product and its main purpose."
                required
              />
            </div>

          </section>

          {/* PRODUCT DETAILS */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Product Details
              </h2>

              <p>
                This verified information
                improves AI-generated reviews.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-features">
                Features
              </label>

              <textarea id="admin-field-features"
                name="features"
                value={Array.isArray(formData.features) ? formData.features.join(", ") : formData.features}
                onChange={handleChange}
                rows="3"
                placeholder="AI writing, Text rewriting, Summarization"
              />

              <small>
                Separate each feature
                with a comma.
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
                placeholder="Content creators, Marketing teams, Small businesses"
              />

              <small>
                Separate each audience
                with a comma.
              </small>
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
                placeholder="WordPress, Slack, Zapier"
              />

              <small>
                Only enter integrations
                you have verified.
              </small>
            </div>

          </section>

          {/* PRICING */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>Pricing</h2>

              <p>
                Store verified general
                pricing information.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-pricingInfo">
                Pricing Information
              </label>

              <textarea id="admin-field-pricingInfo"
                name="pricingInfo"
                value={
                  formData.pricingInfo
                }
                onChange={handleChange}
                rows="4"
                placeholder="Example: Plans start at $19/month. Annual billing is available."
              />

              <small>
                Deals and temporary discounts
                should still be stored in
                the Deals system.
              </small>
            </div>

          </section>

          {/* EDITORIAL INPUT */}

          <section className="product-editor-section">

            <div className="product-editor-section-heading">
              <h2>
                Editorial Information
              </h2>

              <p>
                Verified strengths and
                limitations Gemini may use
                when drafting reviews.
              </p>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-strengths">
                Strengths
              </label>

              <textarea id="admin-field-strengths"
                name="strengths"
                value={Array.isArray(formData.strengths) ? formData.strengths.join(", ") : formData.strengths}
                onChange={handleChange}
                rows="3"
                placeholder="Easy to use, Fast workflow, Clean interface"
              />

              <small>
                Separate each strength
                with a comma.
              </small>
            </div>

            <div className="product-form-field">
              <label htmlFor="admin-field-limitations">
                Limitations
              </label>

              <textarea id="admin-field-limitations"
                name="limitations"
                value={Array.isArray(formData.limitations) ? formData.limitations.join(", ") : formData.limitations}
                onChange={handleChange}
                rows="3"
                placeholder="Limited advanced customization, Requires review of generated content"
              />

              <small>
                Separate each limitation
                with a comma.
              </small>
            </div>

          </section>

          {/* ACTIONS */}

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
              disabled={
                loading ||
                loadingCategories
              }
            >
              {loading
                ? "Creating..."
                : "Create Product"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}