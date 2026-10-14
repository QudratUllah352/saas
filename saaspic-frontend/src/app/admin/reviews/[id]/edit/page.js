"use client";

import { API_URL as API } from "@/lib/api";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";


export default function EditReviewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [products, setProducts] = useState([]);
    const [deals, setDeals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        product: "",
        deal: "",

        title: "",
        slug: "",
        excerpt: "",
        introduction: "",

        overallRating: 0,
        ratingFeatures: 0,
        ratingEaseOfUse: 0,
        ratingValueForMoney: 0,
        ratingSupport: 0,

        quickVerdict: "",
        topPros: "",
        biggestLimitation: "",

        overview: "",
        targetAudience: "",

        pros: "",
        cons: "",

        alternatives: [],

        verdict: "",

        author: "",
        readTime: 5,
    });

    const [features, setFeatures] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        loadPageData();
    }, [id, router]);

    async function loadPageData() {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("adminToken");

            const [
                reviewResponse,
                productsResponse,
                dealsResponse,
            ] = await Promise.all([
                fetch(`${API}/reviews/admin/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),

                fetch(`${API}/products`),

                fetch(`${API}/deals/admin/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            if (
                reviewResponse.status === 401 ||
                reviewResponse.status === 403 ||
                dealsResponse.status === 401 ||
                dealsResponse.status === 403
            ) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");

                router.replace("/login");
                return;
            }

            if (!reviewResponse.ok) {
                throw new Error("Could not load review");
            }

            if (!productsResponse.ok) {
                throw new Error("Could not load products");
            }

            if (!dealsResponse.ok) {
                throw new Error("Could not load deals");
            }

            const review = await reviewResponse.json();
            const productData = await productsResponse.json();
            const dealData = await dealsResponse.json();

            setProducts(productData);
            setDeals(dealData);

            setFormData({
                product: review.product?._id || "",
                deal: review.deal?._id || "",

                title: review.title || "",
                slug: review.slug || "",
                excerpt: review.excerpt || "",
                introduction: review.introduction || "",

                overallRating:
                    review.overallRating ?? 0,

                ratingFeatures:
                    review.ratingBreakdown?.features ?? 0,

                ratingEaseOfUse:
                    review.ratingBreakdown?.easeOfUse ?? 0,

                ratingValueForMoney:
                    review.ratingBreakdown?.valueForMoney ?? 0,

                ratingSupport:
                    review.ratingBreakdown?.support ?? 0,

                quickVerdict:
                    review.quickVerdict || "",

                topPros:
                    review.topPros?.join(", ") || "",

                biggestLimitation:
                    review.biggestLimitation || "",

                overview:
                    review.overview || "",

                targetAudience:
                    review.targetAudience?.join(", ") || "",

                pros:
                    review.pros?.join(", ") || "",

                cons:
                    review.cons?.join(", ") || "",

                alternatives:
                    review.alternatives?.map(
                        (alternative) => alternative._id
                    ) || [],

                verdict:
                    review.verdict || "",

                author:
                    review.author || "",

                readTime:
                    review.readTime || 5,
            });

            setFeatures(
                review.features?.length
                    ? review.features.map((feature) => ({
                        title: feature.title || "",
                        description:
                            feature.description || "",
                    }))
                    : [
                        {
                            title: "",
                            description: "",
                        },
                    ]
            );

            setPricingPlans(
                review.pricingPlans?.length
                    ? review.pricingPlans.map((plan) => ({
                        name: plan.name || "",
                        price: plan.price || "",
                        billing: plan.billing || "",
                        description:
                            plan.description || "",
                        features:
                            plan.features?.join(", ") || "",
                    }))
                    : [
                        {
                            name: "",
                            price: "",
                            billing: "",
                            description: "",
                            features: "",
                        },
                    ]
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function commaToArray(value) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    // ==========================================
    // FEATURES
    // ==========================================

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
            previous.map((feature, currentIndex) =>
                currentIndex === index
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
                (_, currentIndex) =>
                    currentIndex !== index
            )
        );
    }

    // ==========================================
    // PRICING
    // ==========================================

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

    function updatePricingPlan(index, field, value) {
        setPricingPlans((previous) =>
            previous.map((plan, currentIndex) =>
                currentIndex === index
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
                (_, currentIndex) =>
                    currentIndex !== index
            )
        );
    }

    // ==========================================
    // ALTERNATIVES
    // ==========================================

    function handleAlternativeChange(event) {
        const values = Array.from(
            event.target.selectedOptions
        ).map((option) => option.value);

        setFormData((previous) => ({
            ...previous,
            alternatives: values,
        }));
    }

    const filteredDeals = deals.filter(
        (deal) =>
            deal.product?._id === formData.product
    );

    const alternativeProducts = products.filter(
        (product) =>
            product._id !== formData.product
    );
    async function handleGenerateAI() {
        if (!formData.product) {
            setError("Select a product first.");
            return;
        }

        try {
            setGeneratingAI(true);
            setError("");
            setSuccess("");

            const token = localStorage.getItem("adminToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            const response = await fetch(
                `${API}/ai-review/generate`,
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

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not generate AI review."
                );
            }

            setFormData((previous) => ({
                ...previous,

                title: data.title || previous.title,
                slug: data.slug || previous.slug,
                excerpt: data.excerpt || previous.excerpt,
                introduction:
                    data.introduction || previous.introduction,

                overallRating:
                    data.overallRating ?? previous.overallRating,

                ratingFeatures:
                    data.ratingBreakdown?.features ??
                    previous.ratingFeatures,

                ratingEaseOfUse:
                    data.ratingBreakdown?.easeOfUse ??
                    previous.ratingEaseOfUse,

                ratingValueForMoney:
                    data.ratingBreakdown?.valueForMoney ??
                    previous.ratingValueForMoney,

                ratingSupport:
                    data.ratingBreakdown?.support ??
                    previous.ratingSupport,

                quickVerdict:
                    data.quickVerdict || previous.quickVerdict,

                topPros: Array.isArray(data.topPros)
                    ? data.topPros.join(", ")
                    : previous.topPros,

                biggestLimitation:
                    data.biggestLimitation ||
                    previous.biggestLimitation,

                overview:
                    data.overview || previous.overview,

                targetAudience:
                    Array.isArray(data.targetAudience)
                        ? data.targetAudience.join(", ")
                        : previous.targetAudience,

                pros: Array.isArray(data.pros)
                    ? data.pros.join(", ")
                    : previous.pros,

                cons: Array.isArray(data.cons)
                    ? data.cons.join(", ")
                    : previous.cons,

                verdict:
                    data.verdict || previous.verdict,

                author:
                    data.author || previous.author,

                readTime:
                    data.readTime || previous.readTime,
            }));

            if (Array.isArray(data.features)) {
                setFeatures(data.features);
            }

            if (Array.isArray(data.pricingPlans)) {
                setPricingPlans(
                    data.pricingPlans.map((plan) => ({
                        ...plan,
                        features: Array.isArray(plan.features)
                            ? plan.features.join(", ")
                            : plan.features || "",
                    }))
                );
            }

            setSuccess(
                "AI review generated. Review the changes before saving."
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setGeneratingAI(false);
        }
    }
    // ==========================================
    // SAVE
    // ==========================================

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                router.replace("/login");
                return;
            }

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
                deal: formData.deal || null,

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

                overview:
                    formData.overview,

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

                verdict:
                    formData.verdict,

                author:
                    formData.author,

                readTime: Number(
                    formData.readTime
                ),
            };

            const response = await fetch(
                `${API}/reviews/${id}`,
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

                router.replace(
                    "/login"
                );

                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not update review"
                );
            }

            setSuccess(
                "Review updated successfully."
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="review-editor-page">
                <div className="review-editor-container">
                    <p role="status" aria-live="polite">Loading review...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="review-editor-page">
            <div className="review-editor-container">

                <div className="review-editor-header">
                    <div>
                        <span className="admin-dashboard-label">
                            ADMIN
                        </span>

                        <h1>Edit Review</h1>

                        <p>
                            Update your detailed SaaS review.
                        </p>
                    </div>

                    <Link
                        href="/admin/reviews"
                        className="admin-back-button"
                    >
                        ← Reviews
                    </Link>
                </div>

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="admin-success" role="status" aria-live="polite">
                        {success}
                    </div>
                )}
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
                            <h3>Regenerate Review with AI</h3>
                            <p>
                                Re-analyze product specs and generate structured review content, scores, pros, cons, and verdict.
                                Review and modify before saving.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="admin-ai-action-btn"
                            onClick={handleGenerateAI}
                            disabled={generatingAI || !formData.product}
                        >
                            {generatingAI ? (
                                <>
                                    <span className="admin-spinner" />
                                    <span>Generating Review...</span>
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
                <form
                    onSubmit={handleSubmit}
                    className="review-editor-form"
                >

                    {/* BASIC INFORMATION */}

                    <EditorSection
                        number="01"
                        title="Basic Information"
                    >
                        <Field label="Product">
                            <select
                                name="product"
                                value={formData.product}
                                onChange={(event) => {
                                    setFormData((previous) => ({
                                        ...previous,
                                        product: event.target.value,
                                        deal: "",
                                        alternatives:
                                            previous.alternatives.filter(
                                                (productId) =>
                                                    productId !== event.target.value
                                            ),
                                    }));
                                }}
                                required
                            >
                                <option value="">
                                    Select product
                                </option>

                                {products.map((product) => (
                                    <option
                                        key={product._id}
                                        value={product._id}
                                    >
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Related Deal">
                            <select
                                name="deal"
                                value={formData.deal}
                                onChange={handleChange}
                            >
                                <option value="">
                                    No related deal
                                </option>

                                {filteredDeals.map((deal) => (
                                    <option
                                        key={deal._id}
                                        value={deal._id}
                                    >
                                        {deal.discount} — $
                                        {deal.price}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Title">
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Slug">
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Excerpt">
                            <textarea
                                name="excerpt"
                                rows="3"
                                value={formData.excerpt}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Introduction">
                            <textarea
                                name="introduction"
                                rows="6"
                                value={formData.introduction}
                                onChange={handleChange}
                                required
                            />
                        </Field>
                    </EditorSection>


                    {/* RATINGS */}

                    <EditorSection
                        number="02"
                        title="Ratings"
                    >
                        <div className="review-rating-grid">

                            <RatingField
                                label="Overall"
                                name="overallRating"
                                value={
                                    formData.overallRating
                                }
                                onChange={handleChange}
                            />

                            <RatingField
                                label="Features"
                                name="ratingFeatures"
                                value={
                                    formData.ratingFeatures
                                }
                                onChange={handleChange}
                            />

                            <RatingField
                                label="Ease of Use"
                                name="ratingEaseOfUse"
                                value={
                                    formData.ratingEaseOfUse
                                }
                                onChange={handleChange}
                            />

                            <RatingField
                                label="Value"
                                name="ratingValueForMoney"
                                value={
                                    formData.ratingValueForMoney
                                }
                                onChange={handleChange}
                            />

                            <RatingField
                                label="Support"
                                name="ratingSupport"
                                value={
                                    formData.ratingSupport
                                }
                                onChange={handleChange}
                            />

                        </div>
                    </EditorSection>


                    {/* QUICK VERDICT */}

                    <EditorSection
                        number="03"
                        title="Quick Verdict"
                    >
                        <Field label="Quick Verdict">
                            <textarea
                                name="quickVerdict"
                                rows="5"
                                value={
                                    formData.quickVerdict
                                }
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Top Pros">
                            <input
                                name="topPros"
                                value={formData.topPros}
                                onChange={handleChange}
                            />
                        </Field>

                        <Field label="Biggest Limitation">
                            <input
                                name="biggestLimitation"
                                value={
                                    formData.biggestLimitation
                                }
                                onChange={handleChange}
                            />
                        </Field>
                    </EditorSection>


                    {/* OVERVIEW */}

                    <EditorSection
                        number="04"
                        title="Product Overview"
                    >
                        <Field label="Overview">
                            <textarea
                                name="overview"
                                rows="8"
                                value={formData.overview}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Target Audience">
                            <input
                                name="targetAudience"
                                value={
                                    formData.targetAudience
                                }
                                onChange={handleChange}
                            />
                        </Field>
                    </EditorSection>


                    {/* FEATURES */}

                    <EditorSection
                        number="05"
                        title="Key Features"
                    >
                        <div className="dynamic-items">

                            {features.map(
                                (feature, index) => (
                                    <div
                                        className="dynamic-item"
                                        key={index}
                                    >
                                        <div className="dynamic-item-header">
                                            <h3>
                                                Feature {index + 1}
                                            </h3>

                                            <button
                                                type="button"
                                                className="remove-item-button"
                                                onClick={() =>
                                                    removeFeature(index)
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <Field label="Title">
                                            <input
                                                value={feature.title}
                                                onChange={(event) =>
                                                    updateFeature(
                                                        index,
                                                        "title",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Description">
                                            <textarea
                                                rows="5"
                                                value={
                                                    feature.description
                                                }
                                                onChange={(event) =>
                                                    updateFeature(
                                                        index,
                                                        "description",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Field>
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
                    </EditorSection>


                    {/* PRICING */}

                    <EditorSection
                        number="06"
                        title="Pricing Plans"
                    >
                        <div className="dynamic-items">

                            {pricingPlans.map(
                                (plan, index) => (
                                    <div
                                        className="dynamic-item"
                                        key={index}
                                    >
                                        <div className="dynamic-item-header">
                                            <h3>
                                                Plan {index + 1}
                                            </h3>

                                            <button
                                                type="button"
                                                className="remove-item-button"
                                                onClick={() =>
                                                    removePricingPlan(index)
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="review-two-columns">

                                            <Field label="Name">
                                                <input
                                                    value={plan.name}
                                                    onChange={(event) =>
                                                        updatePricingPlan(
                                                            index,
                                                            "name",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </Field>

                                            <Field label="Price">
                                                <input
                                                    value={plan.price}
                                                    onChange={(event) =>
                                                        updatePricingPlan(
                                                            index,
                                                            "price",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </Field>

                                        </div>

                                        <Field label="Billing">
                                            <input
                                                value={plan.billing}
                                                onChange={(event) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "billing",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Description">
                                            <textarea
                                                rows="3"
                                                value={
                                                    plan.description
                                                }
                                                onChange={(event) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "description",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Field>

                                        <Field label="Features">
                                            <input
                                                value={plan.features}
                                                onChange={(event) =>
                                                    updatePricingPlan(
                                                        index,
                                                        "features",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                )
                            )}

                        </div>

                        <button
                            type="button"
                            className="add-item-button"
                            onClick={addPricingPlan}
                        >
                            + Add Pricing Plan
                        </button>
                    </EditorSection>


                    {/* PROS / CONS */}

                    <EditorSection
                        number="07"
                        title="Pros & Cons"
                    >
                        <div className="review-two-columns">

                            <Field label="Pros">
                                <textarea
                                    name="pros"
                                    rows="5"
                                    value={formData.pros}
                                    onChange={handleChange}
                                />
                            </Field>

                            <Field label="Cons">
                                <textarea
                                    name="cons"
                                    rows="5"
                                    value={formData.cons}
                                    onChange={handleChange}
                                />
                            </Field>

                        </div>
                    </EditorSection>


                    {/* ALTERNATIVES */}

                    <EditorSection
                        number="08"
                        title="Alternatives"
                    >
                        <Field label="Alternative Products">
                            <select
                                multiple
                                className="alternatives-select"
                                value={
                                    formData.alternatives
                                }
                                onChange={
                                    handleAlternativeChange
                                }
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
                        </Field>
                    </EditorSection>


                    {/* FINAL VERDICT */}

                    <EditorSection
                        number="09"
                        title="Final Verdict"
                    >
                        <Field label="Verdict">
                            <textarea
                                name="verdict"
                                rows="8"
                                value={formData.verdict}
                                onChange={handleChange}
                                required
                            />
                        </Field>
                    </EditorSection>


                    {/* ARTICLE INFORMATION */}

                    <EditorSection
                        number="10"
                        title="Article Information"
                    >
                        <div className="review-two-columns">

                            <Field label="Author">
                                <input
                                    name="author"
                                    value={formData.author}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>

                            <Field label="Read Time">
                                <input
                                    type="number"
                                    name="readTime"
                                    min="1"
                                    value={formData.readTime}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>

                        </div>
                    </EditorSection>


                    {/* SAVE */}

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


// ==========================================
// SMALL COMPONENTS
// ==========================================

function EditorSection({
    number,
    title,
    children,
}) {
    return (
        <section className="review-editor-section">

            <div className="review-section-title">
                <span>{number}</span>

                <div>
                    <h2>{title}</h2>
                </div>
            </div>

            {children}

        </section>
    );
}


function Field({
    label,
    children,
}) {
    return (
        <div className="admin-edit-field">
            <label>{label}</label>

            {children}
        </div>
    );
}


function RatingField({
    label,
    name,
    value,
    onChange,
}) {
    return (
        <Field label={label}>
            <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                name={name}
                value={value}
                onChange={onChange}
                required
            />
        </Field>
    );
}