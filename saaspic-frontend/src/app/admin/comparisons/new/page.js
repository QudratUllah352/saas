"use client";

import { API_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewComparisonPage() {
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] =
        useState(true);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [generatingAI, setGeneratingAI] =
        useState(false);

    const [aiMessage, setAiMessage] =
        useState("");

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
    // LOAD PRODUCTS
    // ==========================================

    useEffect(() => {
        async function loadProducts() {
            try {
                const token =
                    localStorage.getItem("adminToken");

                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/products`,
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Could not load products"
                    );
                }

                const data = await response.json();

                setProducts(data);
            } catch (error) {
                console.error(error);
                setError(error.message);
            } finally {
                setLoadingProducts(false);
            }
        }

        loadProducts();
    }, [router]);

    // ==========================================
    // NORMAL INPUT CHANGE
    // ==========================================

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // ==========================================
    // GENERATE SLUG
    // ==========================================

    function generateSlug(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function handleTitleChange(event) {
        const value = event.target.value;

        setForm((previous) => ({
            ...previous,
            title: value,
            slug: generateSlug(value),
        }));
    }

    // ==========================================
    // COMMA TEXT -> ARRAY
    // ==========================================

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
            previous.map((point, pointIndex) =>
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

    async function generateWithAI() {
        try {
            setGeneratingAI(true);
            setError("");
            setAiMessage("");

            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                router.push("/login");
                return;
            }

            if (!form.productA || !form.productB) {
                throw new Error(
                    "Please select Product A and Product B first."
                );
            }

            if (form.productA === form.productB) {
                throw new Error(
                    "Please select two different products."
                );
            }

            const response = await fetch(
                `${API_URL}/ai/comparisons/generate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
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

            const generated = data.comparison;

            if (!generated) {
                throw new Error(
                    "AI did not return comparison data."
                );
            }

            // Fill normal form fields
            setForm((previous) => ({
                ...previous,

                title:
                    generated.title ||
                    previous.title,

                slug:
                    generated.slug ||
                    previous.slug,

                excerpt:
                    generated.excerpt ||
                    previous.excerpt,

                introduction:
                    generated.introduction ||
                    previous.introduction,

                productABestFor:
                    Array.isArray(
                        generated.productABestFor
                    )
                        ? generated.productABestFor.join(", ")
                        : "",

                productBBestFor:
                    Array.isArray(
                        generated.productBBestFor
                    )
                        ? generated.productBBestFor.join(", ")
                        : "",

                productAStrengths:
                    Array.isArray(
                        generated.productAStrengths
                    )
                        ? generated.productAStrengths.join(", ")
                        : "",

                productBStrengths:
                    Array.isArray(
                        generated.productBStrengths
                    )
                        ? generated.productBStrengths.join(", ")
                        : "",

                productALimitations:
                    Array.isArray(
                        generated.productALimitations
                    )
                        ? generated.productALimitations.join(", ")
                        : "",

                productBLimitations:
                    Array.isArray(
                        generated.productBLimitations
                    )
                        ? generated.productBLimitations.join(", ")
                        : "",

                conclusion:
                    generated.conclusion ||
                    previous.conclusion,

                readTime:
                    Number(generated.readTime) || 5,
            }));

            // Fill comparison points
            if (
                Array.isArray(
                    generated.comparisonPoints
                ) &&
                generated.comparisonPoints.length > 0
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

            setAiMessage(
                `AI comparison generated successfully${data.model
                    ? ` using ${data.model}`
                    : ""
                }. Review the content before saving.`
            );
        } catch (error) {
            console.error(
                "AI comparison error:",
                error
            );

            setError(error.message);
        } finally {
            setGeneratingAI(false);
        }
    }

    // ==========================================
    // SAVE COMPARISON
    // ==========================================

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const token =
                localStorage.getItem("adminToken");

            if (!token) {
                router.push("/login");
                return;
            }

            if (!form.productA || !form.productB) {
                throw new Error(
                    "Please select both products"
                );
            }

            if (form.productA === form.productB) {
                throw new Error(
                    "Product A and Product B must be different"
                );
            }

            const cleanComparisonPoints =
                comparisonPoints
                    .filter(
                        (point) =>
                            point.title.trim() &&
                            point.productA.trim() &&
                            point.productB.trim()
                    )
                    .map((point) => ({
                        title: point.title.trim(),
                        productA: point.productA.trim(),
                        productB: point.productB.trim(),
                    }));

            const body = {
                title: form.title.trim(),
                slug: form.slug.trim(),

                productA: form.productA,
                productB: form.productB,

                excerpt: form.excerpt.trim(),
                introduction:
                    form.introduction.trim(),

                comparisonPoints:
                    cleanComparisonPoints,

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
                `${API_URL}/comparisons`,
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

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Could not create comparison"
                );
            }

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

    if (loadingProducts) {
        return (
            <main className="admin-reviews-page">
                <div className="admin-reviews-container">
                    <p role="status" aria-live="polite">Loading products...</p>
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

                        <h1>New Comparison</h1>

                        <p>
                            Compare two SaaS products and
                            save the comparison as a draft.
                        </p>
                    </div>

                    <Link
                        href="/admin/comparisons"
                        className="admin-secondary-button"
                    >
                        ← Back to Comparisons
                    </Link>

                </div>

                {error && (
                    <div className="admin-error-message" role="alert">
                        {error}
                    </div>
                )}
                {aiMessage && (
                    <div className="admin-ai-message" role="status" aria-live="polite">
                        {aiMessage}
                    </div>
                )}
                <form
                    onSubmit={handleSubmit}
                    className="admin-review-form"
                >

                    {/* ============================= */}
                    {/* BASIC INFORMATION */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Basic Information</h2>

                        <label>
                            Comparison Title
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleTitleChange}
                                placeholder="TaskPilot AI vs TaskFlow"
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
                                placeholder="taskpilot-ai-vs-taskflow"
                                required
                            />
                        </label>

                        <label>
                            Short Excerpt
                            <textarea
                                name="excerpt"
                                value={form.excerpt}
                                onChange={handleChange}
                                placeholder="A short summary of this comparison..."
                                rows="3"
                                required
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* PRODUCT SELECTION */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Select Products</h2>

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
                                        Select Product A
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
                                        Select Product B
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

                    </section>

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
                                <h3>Generate Head-to-Head Comparison</h3>
                                <p>
                                    Compare the two selected products based on their specifications in your database.
                                    Generates introduction, strengths, limitations, comparison points, and verdict.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="admin-ai-action-btn"
                                onClick={generateWithAI}
                                disabled={
                                    generatingAI ||
                                    !form.productA ||
                                    !form.productB ||
                                    form.productA === form.productB
                                }
                            >
                                {generatingAI ? (
                                    <>
                                        <span className="admin-spinner" />
                                        <span>Generating Comparison...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Generate Comparison with AI</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {aiMessage && (
                            <p className="admin-ai-message-pill">{aiMessage}</p>
                        )}
                    </div>

                    {/* ============================= */}
                    {/* INTRODUCTION */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Introduction</h2>

                        <label>
                            Introduction
                            <textarea
                                name="introduction"
                                value={form.introduction}
                                onChange={handleChange}
                                placeholder="Introduce the two products and explain what this comparison covers..."
                                rows="7"
                                required
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* COMPARISON TABLE */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Comparison Points</h2>

                        <p>
                            Add features or areas where the
                            two products should be compared.
                        </p>

                        {comparisonPoints.map(
                            (point, index) => (
                                <div
                                    key={index}
                                    className="comparison-point-editor"
                                >

                                    <input
                                        type="text"
                                        placeholder="Comparison point, e.g. AI Task Generation"
                                        value={point.title}
                                        onChange={(event) =>
                                            handlePointChange(
                                                index,
                                                "title",
                                                event.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Product A result"
                                        value={point.productA}
                                        onChange={(event) =>
                                            handlePointChange(
                                                index,
                                                "productA",
                                                event.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Product B result"
                                        value={point.productB}
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

                    {/* ============================= */}
                    {/* BEST FOR */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Best For</h2>

                        <p>
                            Separate multiple items using
                            commas.
                        </p>

                        <label>
                            Product A Best For
                            <textarea
                                name="productABestFor"
                                value={
                                    form.productABestFor
                                }
                                onChange={handleChange}
                                placeholder="Freelancers, Small teams, Content creators"
                                rows="3"
                            />
                        </label>

                        <label>
                            Product B Best For
                            <textarea
                                name="productBBestFor"
                                value={
                                    form.productBBestFor
                                }
                                onChange={handleChange}
                                placeholder="Project managers, Remote teams, Startups"
                                rows="3"
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* STRENGTHS */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Strengths</h2>

                        <p>
                            Separate multiple strengths
                            using commas.
                        </p>

                        <label>
                            Product A Strengths
                            <textarea
                                name="productAStrengths"
                                value={
                                    form.productAStrengths
                                }
                                onChange={handleChange}
                                placeholder="Simple interface, AI planning, Quick setup"
                                rows="4"
                            />
                        </label>

                        <label>
                            Product B Strengths
                            <textarea
                                name="productBStrengths"
                                value={
                                    form.productBStrengths
                                }
                                onChange={handleChange}
                                placeholder="Team collaboration, Task organization, Easy workflow"
                                rows="4"
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* LIMITATIONS */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Limitations</h2>

                        <p>
                            Separate multiple limitations
                            using commas.
                        </p>

                        <label>
                            Product A Limitations
                            <textarea
                                name="productALimitations"
                                value={
                                    form.productALimitations
                                }
                                onChange={handleChange}
                                placeholder="Limited advanced reporting, Limited customization"
                                rows="4"
                            />
                        </label>

                        <label>
                            Product B Limitations
                            <textarea
                                name="productBLimitations"
                                value={
                                    form.productBLimitations
                                }
                                onChange={handleChange}
                                placeholder="No AI planning, Limited integrations"
                                rows="4"
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* CONCLUSION */}
                    {/* ============================= */}

                    <section className="admin-form-section">

                        <h2>Conclusion</h2>

                        <label>
                            Final Conclusion
                            <textarea
                                name="conclusion"
                                value={form.conclusion}
                                onChange={handleChange}
                                placeholder="Summarize the important differences and explain which types of users each product may suit..."
                                rows="8"
                                required
                            />
                        </label>

                    </section>

                    {/* ============================= */}
                    {/* AUTHOR */}
                    {/* ============================= */}

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

                    {/* ============================= */}
                    {/* SAVE */}
                    {/* ============================= */}

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
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save as Draft"}
                        </button>

                    </div>

                </form>

            </div>
        </main>
    );
}