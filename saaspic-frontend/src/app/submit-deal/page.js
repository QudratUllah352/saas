"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import "@/app/public-pages.css";


import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SubmitDealPage() {
  const [formData, setFormData] = useState({
    productName: "",
    website: "",
    email: "",
    category: "",
    deal: "",
    description: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categories from MongoDB
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // =========================
  // HANDLE FORM CHANGE
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================
  // FETCH CATEGORIES
  // =========================
  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategoriesLoading(true);

        const response = await fetch(
          `${API_URL}/categories`
        );

        if (!response.ok) {
          throw new Error("Could not load categories");
        }

        const data = await response.json();

        setCategories(data);
      } catch (error) {
        console.error(
          "Category loading error:",
          error
        );

        setError(
          "Could not load categories. Please try again."
        );
      } finally {
        setCategoriesLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // =========================
  // SUBMIT DEAL
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/deal-submissions`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not submit deal"
        );
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // RESET FORM
  // =========================
  function resetForm() {
    setSubmitted(false);
    setError("");

    setFormData({
      productName: "",
      website: "",
      email: "",
      category: "",
      deal: "",
      description: "",
    });
  }

  return (
    <>
      <Navbar />

      <main className="submit-page public-page">
        <Breadcrumbs standalone structuredData={false} items={[{ name: "Home", path: "/" }, { name: "Submit Deal", path: "/submit-deal" }]} />

        {/* HERO */}

        <section className="submit-hero">
          <div className="submit-container">

            <span className="submit-eyebrow">
              PARTNER WITH SAASPIN
            </span>

            <h1>
              Submit Your SaaS Deal
            </h1>

            <p>
              Have a great offer for SaaS users?
              Submit your deal and get your product in front
              of businesses looking for the right software.
            </p>

          </div>
        </section>

        {/* FORM SECTION */}

        <section className="submit-form-section">

          <div className="submit-container">

            <div className="submit-layout">

              {/* LEFT SIDE */}

              <div className="submit-sidebar">

                <span>
                  SUBMIT A DEAL
                </span>

                <h2>
                  Tell us about your offer
                </h2>

                <p>
                  Provide accurate information about your
                  product and promotion. Our team can review
                  the submission before publishing it.
                </p>

                <div className="submit-benefits">

                  <div className="submit-benefit">
                    <div>✓</div>

                    <div>
                      <strong>
                        Reach SaaS buyers
                      </strong>

                      <p>
                        Put your offer in front of people
                        actively discovering software.
                      </p>
                    </div>
                  </div>

                  <div className="submit-benefit">
                    <div>✓</div>

                    <div>
                      <strong>
                        Showcase your product
                      </strong>

                      <p>
                        Provide important product and deal
                        information in one place.
                      </p>
                    </div>
                  </div>

                  <div className="submit-benefit">
                    <div>✓</div>

                    <div>
                      <strong>
                        Easy submission
                      </strong>

                      <p>
                        Submit your information using the
                        simple form on this page.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* RIGHT SIDE */}

              <div className="submit-form-card">

                {submitted ? (

                  // SUCCESS MESSAGE

                  <div className="submit-success">

                    <div className="submit-success-icon">
                      ✓
                    </div>

                    <h2>
                      Submission received
                    </h2>

                    <p>
                      Thanks for submitting your SaaS deal.
                      Your information has been received for review.
                    </p>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="submit-again-button"
                    >
                      Submit Another Deal
                    </button>

                  </div>

                ) : (

                  <>
                    <div className="submit-form-title">

                      <h2>
                        Deal Information
                      </h2>

                      <p>
                        Please provide the details of your SaaS offer.
                      </p>

                    </div>

                    <form
                      className="saaspic-submit-form"
                      onSubmit={handleSubmit}
                    >

                      {/* PRODUCT NAME */}

                      <div className="submit-field">

                        <label htmlFor="productName">
                          Product Name
                        </label>

                        <input
                          id="productName"
                          name="productName"
                          type="text"
                          placeholder="e.g. TaskFlow"
                          value={formData.productName}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      {/* WEBSITE */}

                      <div className="submit-field">

                        <label htmlFor="website">
                          Product Website
                        </label>

                        <input
                          id="website"
                          name="website"
                          type="url"
                          placeholder="https://example.com"
                          value={formData.website}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      <div className="submit-two-columns">

                        {/* EMAIL */}

                        <div className="submit-field">

                          <label htmlFor="email">
                            Contact Email
                          </label>

                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />

                        </div>

                        {/* CATEGORY */}

                        <div className="submit-field">

                          <label htmlFor="category">
                            Category
                          </label>

                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            disabled={categoriesLoading}
                          >

                            <option value="">
                              {categoriesLoading
                                ? "Loading categories..."
                                : "Select category"}
                            </option>

                            {categories.map((category) => (
                              <option
                                key={category._id}
                                value={category.name}
                              >
                                {category.name}
                              </option>
                            ))}

                          </select>

                        </div>

                      </div>

                      {/* DEAL */}

                      <div className="submit-field">

                        <label htmlFor="deal">
                          Deal / Offer
                        </label>

                        <input
                          id="deal"
                          name="deal"
                          type="text"
                          placeholder="e.g. 50% OFF annual plan"
                          value={formData.deal}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      {/* DESCRIPTION */}

                      <div className="submit-field">

                        <label htmlFor="description">
                          Deal Description
                        </label>

                        <textarea
                          id="description"
                          name="description"
                          rows="6"
                          placeholder="Tell us about your product and the offer..."
                          value={formData.description}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      {/* ERROR */}

                      {error && (
                        <p className="form-error">
                          {error}
                        </p>
                      )}

                      {/* SUBMIT */}

                      <button
                        type="submit"
                        className="submit-form-button"
                        disabled={
                          loading ||
                          categoriesLoading
                        }
                      >
                        {loading
                          ? "Submitting..."
                          : "Submit Deal"}

                        {!loading && <span>→</span>}
                      </button>

                      <p className="submit-note">
                        By submitting this form, you confirm that
                        the information provided is accurate.
                      </p>

                    </form>

                  </>
                )}

              </div>

            </div>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}
