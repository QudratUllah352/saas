"use client";

import { API_URL as API } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function NewReviewPage() {
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [deals, setDeals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // AI generation state
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiMessage, setAiMessage] = useState("");

    const [formData, setFormData] = useState({
        product: "",
        deal: "",

        title: "",
        slug: "",
        excerpt: "",
        introduction: "",

        overallRating: "4",
        ratingFeatures: "4",
        ratingEaseOfUse: "4",
        ratingValueForMoney: "4",
        ratingSupport: "4",

        quickVerdict: "",
        topPros: "",
        biggestLimitation: "",

        overview: "",
        targetAudience: "",

        pros: "",
        cons: "",

        alternatives: [],

        verdict: "",

        author: "SaaSPic Team",
        readTime: "5",
    });

    const [features, setFeatures] = useState([
        {
            title: "",
            description: "",
        },
    ]);

    const [pricingPlans, setPricingPlans] = useState([
        {
            name: "",
            price: "",
            billing: "",
            description: "",
            features: "",
        },
    ]);

    // =========================================================
    // CHECK ADMIN + LOAD DATA
    // =========================================================

    useEffect(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        loadData();
    }, [router]);

    // =========================================================
    // LOAD PRODUCTS + DEALS
    // =========================================================

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("adminToken");

            const [productResponse, dealResponse] = await Promise.all([
                fetch(`${API}/products`),

                fetch(`${API}/deals/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            if (
                dealResponse.status === 401 ||
                dealResponse.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.replace("/login");
                return;
            }

            if (!productResponse.ok || !dealResponse.ok) {
                throw new Error(
                    "Could not load products and deals"
                );
            }

            const productData = await productResponse.json();
            const dealData = await dealResponse.json();

            setProducts(productData);
            setDeals(dealData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // =========================================================
    // GENERATE REVIEW WITH AI
    // =========================================================

    async function generateWithAI() {
        if (!formData.product) {
            setError("Please select a product first.");
            return;
        }

        try {
            setAiGenerating(true);
            setAiMessage("");
            setError("");

            const token = localStorage.getItem("adminToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                `${API}/ai/reviews/generate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        productId: formData.product,
                    }),
                }
            );

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.replace("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Could not generate review"
                );
            }

            if (!data.review) {
                throw new Error(
                    "AI response did not contain review data."
                );
            }

            const review = data.review;

            // Fill normal form fields
            setFormData((previous) => ({
                ...previous,

                title: review.title || "",
                slug: review.slug || "",
                excerpt: review.excerpt || "",
                introduction: review.introduction || "",

                overallRating: String(
                    review.overallRating ?? 4
                ),

                ratingFeatures: String(
                    review.ratingBreakdown?.features ?? 4
                ),

                ratingEaseOfUse: String(
                    review.ratingBreakdown?.easeOfUse ?? 4
                ),

                ratingValueForMoney: String(
                    review.ratingBreakdown?.valueForMoney ?? 4
                ),

                ratingSupport: String(
                    review.ratingBreakdown?.support ?? 4
                ),

                quickVerdict:
                    review.quickVerdict || "",

                topPros: Array.isArray(review.topPros)
                    ? review.topPros.join(", ")
                    : "",

                biggestLimitation:
                    review.biggestLimitation || "",

                overview:
                    review.overview || "",

                targetAudience: Array.isArray(
                    review.targetAudience
                )
                    ? review.targetAudience.join(", ")
                    : "",

                pros: Array.isArray(review.pros)
                    ? review.pros.join(", ")
                    : "",

                cons: Array.isArray(review.cons)
                    ? review.cons.join(", ")
                    : "",

                verdict:
                    review.verdict || "",

                author:
                    review.author || "SaaSPic Team",

                readTime: String(
                    review.readTime || 5
                ),

                // Automatically select active deal returned
                // by the backend.
                deal:
                    data.dealId || previous.deal,
            }));

            // Fill generated features
            if (
                Array.isArray(review.features) &&
                review.features.length > 0
            ) {
                setFeatures(
                    review.features.map((feature) => ({
                        title: feature.title || "",
                        description:
                            feature.description || "",
                    }))
                );
            } else {
                setFeatures([
                    {
                        title: "",
                        description: "",
                    },
                ]);
            }

            // Fill generated pricing plans
            if (
                Array.isArray(review.pricingPlans) &&
                review.pricingPlans.length > 0
            ) {
                setPricingPlans(
                    review.pricingPlans.map((plan) => ({
                        name: plan.name || "",
                        price: plan.price || "",
                        billing: plan.billing || "",
                        description:
                            plan.description || "",

                        // The form uses comma-separated text.
                        features: Array.isArray(plan.features)
                            ? plan.features.join(", ")
                            : plan.features || "",
                    }))
                );
            } else {
                setPricingPlans([
                    {
                        name: "",
                        price: "",
                        billing: "",
                        description: "",
                        features: "",
                    },
                ]);
            }

            setAiMessage(
                "AI draft generated successfully. Review the information before saving."
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setAiGenerating(false);
        }
    }

    // =========================================================
    // NORMAL INPUT CHANGE
    // =========================================================

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // =========================================================
    // TITLE + AUTOMATIC SLUG
    // =========================================================

    function handleTitleChange(event) {
        const title = event.target.value;

        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        setFormData((previous) => ({
            ...previous,
            title,
            slug,
        }));
    }

    // =========================================================
    // FEATURES
    // =========================================================

    function addFeature() {
        setFeatures((previous) => [
            ...previous,
            {
                title: "",
                description: "",
            },
        ]);
    }

    function updateFeature(index, field, value) {
        setFeatures((previous) =>
            previous.map((feature, featureIndex) =>
                featureIndex === index
                    ? {
                        ...feature,
                        [field]: value,
                    }
                    : feature
            )
        );
    }

    function removeFeature(index) {
        setFeatures((previous) =>
            previous.filter(
                (_, featureIndex) =>
                    featureIndex !== index
            )
        );
    }

    // =========================================================
    // PRICING PLANS
    // =========================================================

    function addPricingPlan() {
        setPricingPlans((previous) => [
            ...previous,
            {
                name: "",
                price: "",
                billing: "",
                description: "",
                features: "",
            },
        ]);
    }

    function updatePricingPlan(
        index,
        field,
        value
    ) {
        setPricingPlans((previous) =>
            previous.map((plan, planIndex) =>
                planIndex === index
                    ? {
                        ...plan,
                        [field]: value,
                    }
                    : plan
            )
        );
    }

    function removePricingPlan(index) {
        setPricingPlans((previous) =>
            previous.filter(
                (_, planIndex) =>
                    planIndex !== index
            )
        );
    }

    // =========================================================
    // HELPER
    // =========================================================

    function commaToArray(value) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    // Only deals belonging to selected product
    const filteredDeals = deals.filter(
        (deal) =>
            deal.product?._id === formData.product
    );

    // Don't show selected product as alternative
    const alternativeProducts = products.filter(
        (product) =>
            product._id !== formData.product
    );

    function handleAlternativeChange(event) {
        const selected = Array.from(
            event.target.selectedOptions
        ).map((option) => option.value);

        setFormData((previous) => ({
            ...previous,
            alternatives: selected,
        }));
    }

    // =========================================================
    // SUBMIT REVIEW
    // =========================================================

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            setSaving(true);
            setError("");

            const cleanFeatures = features
                .filter(
                    (feature) =>
                        feature.title.trim() &&
                        feature.description.trim()
                )
                .map((feature) => ({
                    title: feature.title.trim(),
                    description:
                        feature.description.trim(),
                }));

            const cleanPricingPlans =
                pricingPlans
                    .filter(
                        (plan) =>
                            plan.name.trim() &&
                            plan.price.trim()
                    )
                    .map((plan) => ({
                        name: plan.name.trim(),
                        price: plan.price.trim(),
                        billing: plan.billing.trim(),
                        description:
                            plan.description.trim(),
                        features: commaToArray(
                            plan.features
                        ),
                    }));

            const body = {
                product: formData.product,

                deal:
                    formData.deal || null,

                title: formData.title,
                slug: formData.slug,
                excerpt: formData.excerpt,
                introduction:
                    formData.introduction,

                overallRating: Number(
                    formData.overallRating
                ),

                ratingBreakdown: {
                    features: Number(
                        formData.ratingFeatures
                    ),

                    easeOfUse: Number(
                        formData.ratingEaseOfUse
                    ),

                    valueForMoney: Number(
                        formData.ratingValueForMoney
                    ),

                    support: Number(
                        formData.ratingSupport
                    ),
                },

                quickVerdict:
                    formData.quickVerdict,

                topPros: commaToArray(
                    formData.topPros
                ),

                biggestLimitation:
                    formData.biggestLimitation,

                overview: formData.overview,

                targetAudience: commaToArray(
                    formData.targetAudience
                ),

                features: cleanFeatures,

                pricingPlans:
                    cleanPricingPlans,

                pros: commaToArray(
                    formData.pros
                ),

                cons: commaToArray(
                    formData.cons
                ),

                alternatives:
                    formData.alternatives,

                verdict: formData.verdict,

                author: formData.author,

                readTime: Number(
                    formData.readTime
                ),
            };

            const response = await fetch(
                `${API}/reviews`,
                {
                    method: "POST",

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

                router.replace(
                    "/login"
                );

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not create review"
                );
            }

            router.push("/admin/reviews");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <main className="review-editor-page">
                <div className="review-editor-container">
                    <p>
                        Loading review editor...
                    </p>
                </div>
            </main>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <main className="review-editor-page">
            <div className="review-editor-container">

                {/* HEADER */}

                <div className="review-editor-header">
                    <div>
                        <span className="admin-dashboard-label">
                            ADMIN
                        </span>

                        <h1>Create Review</h1>

                        <p>
                            Create a detailed SaaS review
                            article.
                        </p>
                    </div>

                    <Link
                        href="/admin/reviews"
                        className="admin-back-button"
                    >
                        ← Reviews
                    </Link>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="review-editor-form"
                >

                    {/* ======================================
              01 BASIC INFORMATION
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>01</span>

                            <div>
                                <h2>
                                    Basic Information
                                </h2>

                                <p>
                                    Select the product and
                                    define the review article.
                                </p>
                            </div>
                        </div>

                        {/* PRODUCT */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-product">Product</label>

                            <select id="admin-field-product"
                                name="product"
                                value={formData.product}
                                onChange={(event) => {
                                    const selectedProduct =
                                        event.target.value;

                                    setFormData(
                                        (previous) => ({
                                            ...previous,

                                            product:
                                                selectedProduct,

                                            deal: "",

                                            alternatives:
                                                previous.alternatives.filter(
                                                    (productId) =>
                                                        productId !==
                                                        selectedProduct
                                                ),
                                        })
                                    );

                                    setAiMessage("");
                                }}
                                required
                            >
                                <option value="">
                                    Select product
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

                            <div className="admin-ai-assistant-card">
                                <div className="admin-ai-assistant-header">
                                    <div className="admin-ai-badge">
                                        <span className="admin-ai-sparkle">✨</span>
                                        <span>GEMINI AI REVIEW WRITER</span>
                                    </div>
                                    <span className="admin-ai-notice">
                                        Draft remains fully editable &bull; Never auto-publishes
                                    </span>
                                </div>
                                <div className="admin-ai-assistant-body">
                                    <div className="admin-ai-assistant-info">
                                        <h3>Generate Review Draft</h3>
                                        <p>
                                            Generate full editorial review draft based on selected product specs.
                                            You can review and edit all fields below before saving.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-ai-action-btn"
                                        onClick={generateWithAI}
                                        disabled={
                                            aiGenerating ||
                                            !formData.product
                                        }
                                    >
                                        {aiGenerating ? (
                                            <>
                                                <span className="admin-spinner" />
                                                <span>Generating Review...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✨</span>
                                                <span>Generate Review with AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                {aiMessage && (
                                    <p className="admin-ai-message-pill">
                                        {aiMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* RELATED DEAL */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-deal">Related Deal</label>

                            <select id="admin-field-deal"
                                name="deal"
                                value={formData.deal}
                                onChange={handleChange}
                                disabled={
                                    !formData.product
                                }
                            >
                                <option value="">
                                    No related deal
                                </option>

                                {filteredDeals.map(
                                    (deal) => (
                                        <option
                                            key={deal._id}
                                            value={deal._id}
                                        >
                                            {deal.discount} — $
                                            {deal.price}
                                        </option>
                                    )
                                )}
                            </select>

                            <small>
                                Only deals belonging to
                                the selected product are
                                shown.
                            </small>
                        </div>

                        {/* TITLE */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-title">
                                Review Title
                            </label>

                            <input id="admin-field-title"
                                name="title"
                                value={formData.title}
                                onChange={
                                    handleTitleChange
                                }
                                placeholder="TaskFlow Review 2026"
                                required
                            />
                        </div>

                        {/* SLUG */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-slug">Slug</label>

                            <input id="admin-field-slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="taskflow-review-2026"
                                required
                            />
                        </div>

                        {/* EXCERPT */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-excerpt">Excerpt</label>

                            <textarea id="admin-field-excerpt"
                                name="excerpt"
                                rows="3"
                                value={formData.excerpt}
                                onChange={handleChange}
                                placeholder="Short summary shown on review cards..."
                                required
                            />
                        </div>

                        {/* INTRODUCTION */}

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-introduction">
                                Introduction
                            </label>

                            <textarea id="admin-field-introduction"
                                name="introduction"
                                rows="6"
                                value={
                                    formData.introduction
                                }
                                onChange={handleChange}
                                placeholder="Introduce the software and what this review covers..."
                                required
                            />
                        </div>

                    </section>

                    {/* ======================================
              02 RATINGS
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>02</span>

                            <div>
                                <h2>Ratings</h2>

                                <p>
                                    Score the product from
                                    0 to 5.
                                </p>
                            </div>
                        </div>

                        <div className="review-rating-grid">

                            <RatingInput
                                label="Overall Rating"
                                name="overallRating"
                                value={
                                    formData.overallRating
                                }
                                onChange={handleChange}
                            />

                            <RatingInput
                                label="Features"
                                name="ratingFeatures"
                                value={
                                    formData.ratingFeatures
                                }
                                onChange={handleChange}
                            />

                            <RatingInput
                                label="Ease of Use"
                                name="ratingEaseOfUse"
                                value={
                                    formData.ratingEaseOfUse
                                }
                                onChange={handleChange}
                            />

                            <RatingInput
                                label="Value for Money"
                                name="ratingValueForMoney"
                                value={
                                    formData.ratingValueForMoney
                                }
                                onChange={handleChange}
                            />

                            <RatingInput
                                label="Support"
                                name="ratingSupport"
                                value={
                                    formData.ratingSupport
                                }
                                onChange={handleChange}
                            />

                        </div>
                    </section>

                    {/* ======================================
              03 QUICK VERDICT
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>03</span>

                            <div>
                                <h2>
                                    Quick Verdict
                                </h2>

                                <p>
                                    Give readers the
                                    important information
                                    quickly.
                                </p>
                            </div>
                        </div>

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-quickVerdict">
                                Quick Verdict
                            </label>

                            <textarea id="admin-field-quickVerdict"
                                name="quickVerdict"
                                rows="5"
                                value={
                                    formData.quickVerdict
                                }
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-topPros">Top Pros</label>

                            <input id="admin-field-topPros"
                                name="topPros"
                                value={formData.topPros}
                                onChange={handleChange}
                                placeholder="Easy to use, Good value, Fast setup"
                            />

                            <small>
                                Separate items with
                                commas.
                            </small>
                        </div>

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-biggestLimitation">
                                Biggest Limitation
                            </label>

                            <input id="admin-field-biggestLimitation"
                                name="biggestLimitation"
                                value={
                                    formData.biggestLimitation
                                }
                                onChange={handleChange}
                                placeholder="Limited integrations"
                            />
                        </div>

                    </section>

                    {/* ======================================
              04 PRODUCT OVERVIEW
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>04</span>

                            <div>
                                <h2>
                                    Product Overview
                                </h2>

                                <p>
                                    Explain what the
                                    software does and who
                                    should use it.
                                </p>
                            </div>
                        </div>

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-overview">Overview</label>

                            <textarea id="admin-field-overview"
                                name="overview"
                                rows="8"
                                value={formData.overview}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="admin-edit-field">
                            <label htmlFor="admin-field-targetAudience">
                                Target Audience
                            </label>

                            <input id="admin-field-targetAudience"
                                name="targetAudience"
                                value={
                                    formData.targetAudience
                                }
                                onChange={handleChange}
                                placeholder="Freelancers, Agencies, Small businesses"
                            />

                            <small>
                                Separate items with
                                commas.
                            </small>
                        </div>

                    </section>

                    {/* ======================================
              05 FEATURES
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>05</span>

                            <div>
                                <h2>
                                    Key Features
                                </h2>

                                <p>
                                    Explain the important
                                    features in detail.
                                </p>
                            </div>
                        </div>

                        <div className="dynamic-items">

                            {features.map(
                                (feature, index) => (
                                    <div
                                        key={index}
                                        className="dynamic-item"
                                    >

                                        <div className="dynamic-item-header">

                                            <h3>
                                                Feature{" "}
                                                {index + 1}
                                            </h3>

                                            {features.length >
                                                1 && (
                                                    <button
                                                        type="button"
                                                        className="remove-item-button"
                                                        onClick={() =>
                                                            removeFeature(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                )}

                                        </div>

                                        <div className="admin-edit-field">
                                            <label>
                                                Feature Title
                                            </label>

                                            <input
                                                value={
                                                    feature.title
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateFeature(
                                                        index,
                                                        "title",
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Task Management"
                                            />
                                        </div>

                                        <div className="admin-edit-field">
                                            <label>
                                                Feature
                                                Description
                                            </label>

                                            <textarea
                                                rows="5"
                                                value={
                                                    feature.description
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateFeature(
                                                        index,
                                                        "description",
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Explain what this feature does..."
                                            />
                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                        <button
                            type="button"
                            className="add-item-button"
                            onClick={addFeature}
                        >
                            + Add Feature
                        </button>

                    </section>

                    {/* ======================================
              06 PRICING
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>06</span>

                            <div>
                                <h2>
                                    Pricing Plans
                                </h2>

                                <p>
                                    Add the normal pricing
                                    plans offered by the
                                    product.
                                </p>
                            </div>
                        </div>

                        <div className="dynamic-items">

                            {pricingPlans.map(
                                (plan, index) => (
                                    <div
                                        key={index}
                                        className="dynamic-item"
                                    >

                                        <div className="dynamic-item-header">

                                            <h3>
                                                Plan {index + 1}
                                            </h3>

                                            {pricingPlans.length >
                                                1 && (
                                                    <button
                                                        type="button"
                                                        className="remove-item-button"
                                                        onClick={() =>
                                                            removePricingPlan(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                )}

                                        </div>

                                        <div className="review-two-columns">

                                            <div className="admin-edit-field">
                                                <label>
                                                    Plan Name
                                                </label>

                                                <input
                                                    value={
                                                        plan.name
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePricingPlan(
                                                            index,
                                                            "name",
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Pro"
                                                />
                                            </div>

                                            <div className="admin-edit-field">
                                                <label>
                                                    Price
                                                </label>

                                                <input
                                                    value={
                                                        plan.price
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updatePricingPlan(
                                                            index,
                                                            "price",
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="$19"
                                                />
                                            </div>

                                        </div>

                                        <div className="admin-edit-field">
                                            <label>
                                                Billing
                                            </label>

                                            <input
                                                value={
                                                    plan.billing
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "billing",
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="per month"
                                            />
                                        </div>

                                        <div className="admin-edit-field">
                                            <label>
                                                Description
                                            </label>

                                            <textarea
                                                rows="3"
                                                value={
                                                    plan.description
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "description",
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Best for professionals..."
                                            />
                                        </div>

                                        <div className="admin-edit-field">
                                            <label>
                                                Plan Features
                                            </label>

                                            <input
                                                value={
                                                    plan.features
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "features",
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Unlimited projects, Analytics, Priority support"
                                            />

                                            <small>
                                                Separate items
                                                with commas.
                                            </small>
                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                        <button
                            type="button"
                            className="add-item-button"
                            onClick={
                                addPricingPlan
                            }
                        >
                            + Add Pricing Plan
                        </button>

                    </section>

                    {/* ======================================
              07 PROS & CONS
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>07</span>

                            <div>
                                <h2>
                                    Pros & Cons
                                </h2>
                            </div>
                        </div>

                        <div className="review-two-columns">

                            <div className="admin-edit-field">
                                <label htmlFor="admin-field-pros">Pros</label>

                                <textarea id="admin-field-pros"
                                    name="pros"
                                    rows="5"
                                    value={
                                        formData.pros
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Easy to use, Affordable, Good features"
                                />

                                <small>
                                    Separate items with
                                    commas.
                                </small>
                            </div>

                            <div className="admin-edit-field">
                                <label htmlFor="admin-field-cons">Cons</label>

                                <textarea id="admin-field-cons"
                                    name="cons"
                                    rows="5"
                                    value={
                                        formData.cons
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Limited integrations, No mobile app"
                                />

                                <small>
                                    Separate items with
                                    commas.
                                </small>
                            </div>

                        </div>

                    </section>

                    {/* ======================================
              08 ALTERNATIVES
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>08</span>

                            <div>
                                <h2>
                                    Alternatives
                                </h2>

                                <p>
                                    Select other products
                                    readers may want to
                                    compare.
                                </p>
                            </div>
                        </div>

                        <div className="admin-edit-field">

                            <label>
                                Alternative Products
                            </label>

                            <select
                                multiple
                                value={
                                    formData.alternatives
                                }
                                onChange={
                                    handleAlternativeChange
                                }
                                className="alternatives-select"
                            >

                                {alternativeProducts.map(
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

                            <small>
                                Hold Ctrl on Windows to
                                select multiple products.
                            </small>

                        </div>

                    </section>

                    {/* ======================================
              09 FINAL VERDICT
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>09</span>

                            <div>
                                <h2>
                                    Final Verdict
                                </h2>
                            </div>
                        </div>

                        <div className="admin-edit-field">

                            <label htmlFor="admin-field-verdict">Verdict</label>

                            <textarea id="admin-field-verdict"
                                name="verdict"
                                rows="8"
                                value={
                                    formData.verdict
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Write your final assessment..."
                                required
                            />

                        </div>

                    </section>

                    {/* ======================================
              10 ARTICLE INFORMATION
          ====================================== */}

                    <section className="review-editor-section">

                        <div className="review-section-title">
                            <span>10</span>

                            <div>
                                <h2>
                                    Article Information
                                </h2>
                            </div>
                        </div>

                        <div className="review-two-columns">

                            <div className="admin-edit-field">
                                <label htmlFor="admin-field-author">Author</label>

                                <input id="admin-field-author"
                                    name="author"
                                    value={
                                        formData.author
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                            <div className="admin-edit-field">
                                <label htmlFor="admin-field-readTime">
                                    Read Time
                                    (minutes)
                                </label>

                                <input id="admin-field-readTime"
                                    name="readTime"
                                    type="number"
                                    min="1"
                                    value={
                                        formData.readTime
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                        </div>

                    </section>

                    {/* ======================================
              SAVE BAR
          ====================================== */}

                    <div className="review-editor-save-bar">

                        <Link
                            href="/admin/reviews"
                            className="admin-cancel-button"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                saving ||
                                aiGenerating
                            }
                        >
                            {saving
                                ? "Saving Draft..."
                                : "Save as Draft"}
                        </button>

                    </div>

                </form>
            </div>
        </main>
    );
}

// =========================================================
// RATING INPUT
// =========================================================

function RatingInput({
    label,
    name,
    value,
    onChange,
}) {
    return (
        <div className="admin-edit-field">
            <label>{label}</label>

            <input
                name={name}
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={value}
                onChange={onChange}
                required
            />
        </div>
    );
}
