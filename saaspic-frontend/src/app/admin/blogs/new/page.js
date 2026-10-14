"use client";

import { API_URL } from "@/lib/api";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emptySection = {
    heading: "",
    content: "",
};

export default function NewBlogPage() {
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [topic, setTopic] = useState("");
    const [generatingAI, setGeneratingAI] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        title: "",
        slug: "",
        excerpt: "",
        introduction: "",
        coverImage: "",
        category: "SaaS",
        tags: "",
        sections: [{ ...emptySection }],
        conclusion: "",
        relatedProducts: [],
        author: "SaaSpin Team",
        readTime: 5,
    });

    useEffect(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            router.push("/login");
            return;
        }

        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const response = await fetch(
                `${API_URL}/products`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load products.");
            }

            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            setMessage(error.message);
        }
    }

    function createSlug(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "title"
                ? {
                    slug: createSlug(value),
                }
                : {}),
        }));
    }

    function toggleProduct(productId) {
        setForm((previous) => {
            const exists = previous.relatedProducts.includes(productId);

            return {
                ...previous,
                relatedProducts: exists
                    ? previous.relatedProducts.filter((id) => id !== productId)
                    : [...previous.relatedProducts, productId],
            };
        });
    }

    function updateSection(index, field, value) {
        setForm((previous) => {
            const sections = [...previous.sections];

            sections[index] = {
                ...sections[index],
                [field]: value,
            };

            return {
                ...previous,
                sections,
            };
        });
    }

    function addSection() {
        setForm((previous) => ({
            ...previous,
            sections: [...previous.sections, { ...emptySection }],
        }));
    }

    function removeSection(index) {
        setForm((previous) => ({
            ...previous,
            sections: previous.sections.filter((_, i) => i !== index),
        }));
    }

    async function generateWithAI() {
        if (!topic.trim()) {
            setMessage("Enter a blog topic first.");
            return;
        }

        const token = localStorage.getItem("adminToken");

        try {
            setGeneratingAI(true);
            setMessage("Generating blog draft with AI...");

            const response = await fetch(
                `${API_URL}/ai/blogs/generate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        topic,
                        category: form.category,
                        productIds: form.relatedProducts,
                    }),
                }
            );

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("adminToken");

                setMessage(
                    "Your admin session has expired. Please log in again."
                );

                setTimeout(() => {
                    router.push("/login");
                }, 1200);

                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "AI generation failed.");
            }

            const generated = data.blog;

            setForm((previous) => ({
                ...previous,

                title: generated.title || "",
                slug: generated.slug || "",
                excerpt: generated.excerpt || "",
                introduction: generated.introduction || "",

                category:
                    generated.category ||
                    previous.category,

                tags: Array.isArray(generated.tags)
                    ? generated.tags.join(", ")
                    : "",

                sections:
                    Array.isArray(generated.sections) &&
                        generated.sections.length > 0
                        ? generated.sections
                        : [{ ...emptySection }],

                conclusion: generated.conclusion || "",

                readTime:
                    generated.readTime || 5,

                // Keep admin-selected products.
                relatedProducts:
                    previous.relatedProducts,
            }));

            setMessage(
                `AI draft generated${data.model ? ` using ${data.model}` : ""}. Review it before saving.`
            );
        } catch (error) {
            setMessage(error.message);
        } finally {
            setGeneratingAI(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.title.trim()) {
            setMessage("Blog title is required.");
            return;
        }

        if (!form.excerpt.trim()) {
            setMessage("Excerpt is required.");
            return;
        }

        if (!form.introduction.trim()) {
            setMessage("Introduction is required.");
            return;
        }

        if (!form.conclusion.trim()) {
            setMessage("Conclusion is required.");
            return;
        }

        const token = localStorage.getItem("adminToken");

        try {
            setSaving(true);
            setMessage("");

            const payload = {
                ...form,

                tags: form.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),

                sections: form.sections
                    .map((section) => ({
                        heading: section.heading.trim(),
                        content: section.content.trim(),
                    }))
                    .filter(
                        (section) =>
                            section.heading &&
                            section.content
                    ),

                readTime: Number(form.readTime) || 5,
            };

            const response = await fetch(
                `${API_URL}/blogs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save blog.");
            }

            router.push("/admin/blogs");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="admin-page">

            {/* =========================
        PAGE HEADER
    ========================== */}

            <div className="admin-page-header">
                <div>
                    <p className="admin-eyebrow">Content Management</p>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <h1>Create New Blog</h1>

                        <span className="blog-draft-badge">
                            Draft
                        </span>
                    </div>

                    <p>
                        Create an article manually or use AI to generate
                        an editable first draft.
                    </p>
                </div>

                <Link
                    href="/admin/blogs"
                    className="admin-secondary-button"
                >
                    ← Back to Blogs
                </Link>
            </div>

            {/* =========================
        MESSAGE
    ========================== */}

            {message && (
                <div className="admin-message">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                <div className="blog-editor-layout">

                    {/* ==================================
            LEFT SIDE
        =================================== */}

                    <div className="blog-editor-main">

                        {/* BASIC ARTICLE INFORMATION */}

                        <section className="blog-editor-card">

                            <div className="blog-editor-card-header">
                                <h2>Article</h2>

                                <p>
                                    Write the main information readers will see
                                    on the blog.
                                </p>
                            </div>

                            {/* TITLE */}

                            <div className="blog-form-group">
                                <label htmlFor="blog-title">
                                    Blog Title
                                </label>

                                <input
                                    id="blog-title"
                                    className="blog-title-input"
                                    name="title"
                                    type="text"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Example: How AI Task Management Helps Small Teams"
                                    required
                                />
                            </div>

                            {/* SLUG */}

                            <div className="blog-form-group">
                                <label htmlFor="blog-slug">
                                    URL Slug
                                </label>

                                <input
                                    id="blog-slug"
                                    name="slug"
                                    type="text"
                                    value={form.slug}
                                    onChange={handleChange}
                                    placeholder="how-ai-task-management-helps-small-teams"
                                    required
                                />

                                <p className="blog-field-help">
                                    Used in the public blog URL. It is automatically
                                    generated from the title.
                                </p>
                            </div>

                            {/* EXCERPT */}

                            <div className="blog-form-group">
                                <label htmlFor="blog-excerpt">
                                    Excerpt
                                </label>

                                <textarea
                                    id="blog-excerpt"
                                    name="excerpt"
                                    value={form.excerpt}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Write a short summary of the article..."
                                    required
                                />

                                <p className="blog-field-help">
                                    This summary can appear on blog cards and search
                                    results.
                                </p>
                            </div>

                            {/* INTRODUCTION */}

                            <div className="blog-form-group">
                                <label htmlFor="blog-introduction">
                                    Introduction
                                </label>

                                <textarea
                                    id="blog-introduction"
                                    name="introduction"
                                    value={form.introduction}
                                    onChange={handleChange}
                                    rows="7"
                                    placeholder="Introduce the topic and explain what the reader will learn..."
                                    required
                                />
                            </div>

                        </section>


                        {/* ==================================
              ARTICLE SECTIONS
          =================================== */}

                        <section className="blog-editor-card">

                            <div className="blog-editor-card-header">
                                <h2>Article Sections</h2>

                                <p>
                                    Organize your article into clear sections.
                                    AI-generated sections can also be edited here.
                                </p>
                            </div>

                            <div className="blog-sections-container">

                                {form.sections.map(
                                    (section, index) => (

                                        <div
                                            className="blog-section-editor"
                                            key={index}
                                        >

                                            <div className="blog-section-header">

                                                <h3>
                                                    Section {index + 1}
                                                </h3>

                                                {form.sections.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="blog-remove-section"
                                                        onClick={() =>
                                                            removeSection(index)
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                )}

                                            </div>

                                            {/* SECTION HEADING */}

                                            <input
                                                type="text"
                                                value={section.heading}
                                                onChange={(event) =>
                                                    updateSection(
                                                        index,
                                                        "heading",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Section heading"
                                            />

                                            {/* SECTION CONTENT */}

                                            <textarea
                                                value={section.content}
                                                onChange={(event) =>
                                                    updateSection(
                                                        index,
                                                        "content",
                                                        event.target.value
                                                    )
                                                }
                                                rows="8"
                                                placeholder="Write the section content..."
                                            />

                                        </div>

                                    )
                                )}

                            </div>

                            <div className="blog-add-section">

                                <button
                                    type="button"
                                    className="admin-secondary-button"
                                    onClick={addSection}
                                >
                                    + Add Section
                                </button>

                            </div>

                        </section>


                        {/* ==================================
              CONCLUSION
          =================================== */}

                        <section className="blog-editor-card">

                            <div className="blog-editor-card-header">
                                <h2>Conclusion</h2>

                                <p>
                                    Finish the article with a useful summary for
                                    the reader.
                                </p>
                            </div>

                            <div className="blog-form-group">

                                <textarea
                                    name="conclusion"
                                    value={form.conclusion}
                                    onChange={handleChange}
                                    rows="7"
                                    placeholder="Write the final conclusion..."
                                    required
                                />

                            </div>

                        </section>

                    </div>


                    {/* ==================================
            RIGHT SIDEBAR
        =================================== */}

                    <aside className="blog-editor-sidebar">

                        {/* ==================================
              AI BLOG WRITER
          =================================== */}

                        <section className="admin-ai-assistant-card">
                            <div className="admin-ai-assistant-header">
                                <div className="admin-ai-assistant-title">
                                    <span className="admin-ai-badge">Gemini AI</span>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>AI Blog Writer</h3>
                                </div>
                                <span className="admin-ai-status">Draft Assistant</span>
                            </div>

                            <p className="admin-ai-assistant-desc">
                                Gemini can generate a structured, editable article draft based on your topic and selected product context. You retain full editorial control before saving.
                            </p>

                            <div className="blog-form-group">
                                <label htmlFor="ai-blog-topic" style={{ fontWeight: "600", fontSize: "13px" }}>
                                    Blog Topic or Angle
                                </label>
                                <textarea
                                    id="ai-blog-topic"
                                    value={topic}
                                    onChange={(event) =>
                                        setTopic(event.target.value)
                                    }
                                    rows="4"
                                    placeholder="Example: How AI task management helps small teams streamline workflow"
                                />
                            </div>

                            <button
                                type="button"
                                className="admin-ai-action-btn"
                                onClick={generateWithAI}
                                disabled={generatingAI}
                            >
                                {generatingAI ? (
                                    <>
                                        <span className="admin-ai-spinner" />
                                        <span>Generating Article Draft...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Generate Blog Draft with AI</span>
                                    </>
                                )}
                            </button>

                            <div className="admin-ai-notice">
                                <span>ℹ</span>
                                <span>AI creates editable draft fields only. Content is never automatically published.</span>
                            </div>
                        </section>


                        {/* ==================================
              ARTICLE SETTINGS
          =================================== */}

                        <section className="blog-settings-card">

                            <h2>
                                Article Settings
                            </h2>


                            {/* CATEGORY */}

                            <div className="blog-form-group">

                                <label htmlFor="blog-category">
                                    Category
                                </label>

                                <input
                                    id="blog-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    placeholder="Productivity"
                                />

                            </div>


                            {/* COVER IMAGE */}

                            <div className="blog-form-group">

                                <label htmlFor="cover-image">
                                    Cover Image
                                </label>

                                <input
                                    id="cover-image"
                                    name="coverImage"
                                    value={form.coverImage}
                                    onChange={handleChange}
                                    placeholder="/images/blogs/article.jpg"
                                />

                                <p className="blog-field-help">
                                    Enter an image path for now. Image upload can
                                    be added later.
                                </p>

                            </div>


                            {/* TAGS */}

                            <div className="blog-form-group">

                                <label htmlFor="blog-tags">
                                    Tags
                                </label>

                                <input
                                    id="blog-tags"
                                    name="tags"
                                    value={form.tags}
                                    onChange={handleChange}
                                    placeholder="AI, Productivity, SaaS"
                                />

                                <p className="blog-field-help">
                                    Separate tags with commas.
                                </p>

                            </div>


                            {/* AUTHOR */}

                            <div className="blog-form-group">

                                <label htmlFor="blog-author">
                                    Author
                                </label>

                                <input
                                    id="blog-author"
                                    name="author"
                                    value={form.author}
                                    onChange={handleChange}
                                />

                            </div>


                            {/* READ TIME */}

                            <div className="blog-form-group">

                                <label htmlFor="read-time">
                                    Read Time
                                </label>

                                <input
                                    id="read-time"
                                    name="readTime"
                                    type="number"
                                    min="1"
                                    value={form.readTime}
                                    onChange={handleChange}
                                />

                                <p className="blog-field-help">
                                    Estimated minutes.
                                </p>

                            </div>

                        </section>


                        {/* ==================================
              RELATED PRODUCTS
          =================================== */}

                        <section className="blog-settings-card">

                            <h2>
                                Related Products
                            </h2>

                            <p
                                className="blog-field-help"
                                style={{
                                    marginBottom: "16px",
                                }}
                            >
                                Select products before using AI. Gemini will
                                receive their stored information.
                            </p>


                            {products.length === 0 ? (

                                <div className="blog-no-products">
                                    No products available.
                                </div>

                            ) : (

                                <div className="blog-product-selector">

                                    {products.map((product) => {

                                        const selected =
                                            form.relatedProducts.includes(
                                                product._id
                                            );

                                        return (
                                            <label
                                                className="blog-product-option"
                                                key={product._id}
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        toggleProduct(
                                                            product._id
                                                        )
                                                    }
                                                />

                                                <span className="blog-product-option-content">

                                                    <strong>
                                                        {product.name}
                                                    </strong>

                                                    <small>
                                                        {product.shortDescription ||
                                                            product.description}
                                                    </small>

                                                </span>

                                            </label>
                                        );

                                    })}

                                </div>

                            )}

                        </section>

                    </aside>

                </div>


                {/* ==================================
          BOTTOM ACTIONS
      =================================== */}

                <div className="blog-editor-actions">

                    <Link
                        href="/admin/blogs"
                        className="admin-secondary-button"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        className="admin-primary-button blog-save-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save as Draft"}
                    </button>

                </div>

            </form>

        </main>
    );
}