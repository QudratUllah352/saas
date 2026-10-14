"use client";

import { API_URL } from "@/lib/api";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const emptySection = {
  heading: "",
  content: "",
};

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [products, setProducts] = useState([]);
  const [topic, setTopic] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

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

    loadPage();
  }, [id]);

  async function loadPage() {
    const token = localStorage.getItem("adminToken");

    try {
      setLoading(true);

      const [productsResponse, blogResponse] =
        await Promise.all([
          fetch(`${API_URL}/products`),

          fetch(
            `${API_URL}/blogs/admin/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

      if (
        blogResponse.status === 401 ||
        blogResponse.status === 403
      ) {
        localStorage.removeItem("adminToken");
        router.push("/login");
        return;
      }

      const productsData =
        await productsResponse.json();

      const blogData =
        await blogResponse.json();

      if (!productsResponse.ok) {
        throw new Error(
          productsData.message ||
            "Could not load products."
        );
      }

      if (!blogResponse.ok) {
        throw new Error(
          blogData.message ||
            "Could not load blog."
        );
      }

      setProducts(
        Array.isArray(productsData)
          ? productsData
          : []
      );

      setTopic(blogData.title || "");

      setForm({
        title: blogData.title || "",

        slug: blogData.slug || "",

        excerpt: blogData.excerpt || "",

        introduction:
          blogData.introduction || "",

        coverImage:
          blogData.coverImage || "",

        category:
          blogData.category || "SaaS",

        tags: Array.isArray(blogData.tags)
          ? blogData.tags.join(", ")
          : "",

        sections:
          Array.isArray(blogData.sections) &&
          blogData.sections.length > 0
            ? blogData.sections.map(
                (section) => ({
                  heading:
                    section.heading || "",
                  content:
                    section.content || "",
                })
              )
            : [{ ...emptySection }],

        conclusion:
          blogData.conclusion || "",

        relatedProducts:
          Array.isArray(
            blogData.relatedProducts
          )
            ? blogData.relatedProducts
                .map((product) =>
                  typeof product === "string"
                    ? product
                    : product._id
                )
                .filter(Boolean)
            : [],

        author:
          blogData.author ||
          "SaaSpin Team",

        readTime:
          blogData.readTime || 5,
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function toggleProduct(productId) {
    setForm((previous) => {
      const exists =
        previous.relatedProducts.includes(
          productId
        );

      return {
        ...previous,

        relatedProducts: exists
          ? previous.relatedProducts.filter(
              (id) => id !== productId
            )
          : [
              ...previous.relatedProducts,
              productId,
            ],
      };
    });
  }

  function updateSection(
    index,
    field,
    value
  ) {
    setForm((previous) => {
      const sections = [
        ...previous.sections,
      ];

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

      sections: [
        ...previous.sections,
        { ...emptySection },
      ],
    }));
  }

  function removeSection(index) {
    setForm((previous) => ({
      ...previous,

      sections:
        previous.sections.filter(
          (_, currentIndex) =>
            currentIndex !== index
        ),
    }));
  }

  async function generateWithAI() {
    if (!topic.trim()) {
      setMessage(
        "Enter a blog topic first."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Regenerating with AI will replace the current title, excerpt, introduction, sections and conclusion. Continue?"
      );

    if (!confirmed) return;

    const token =
      localStorage.getItem(
        "adminToken"
      );

    try {
      setGeneratingAI(true);

      setMessage(
        "Generating a new blog draft..."
      );

      const response = await fetch(
        `${API_URL}/ai/blogs/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            topic,

            category:
              form.category,

            productIds:
              form.relatedProducts,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "adminToken"
        );

        router.push(
          "/login"
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI generation failed."
        );
      }

      const generated =
        data.blog;

      setForm((previous) => ({
        ...previous,

        title:
          generated.title || "",

        slug:
          generated.slug ||
          previous.slug,

        excerpt:
          generated.excerpt || "",

        introduction:
          generated.introduction ||
          "",

        category:
          generated.category ||
          previous.category,

        tags:
          Array.isArray(
            generated.tags
          )
            ? generated.tags.join(", ")
            : previous.tags,

        sections:
          Array.isArray(
            generated.sections
          ) &&
          generated.sections.length > 0
            ? generated.sections
            : [{ ...emptySection }],

        conclusion:
          generated.conclusion || "",

        readTime:
          generated.readTime || 5,

        relatedProducts:
          previous.relatedProducts,
      }));

      setMessage(
        `AI regenerated the draft${
          data.model
            ? ` using ${data.model}`
            : ""
        }. Review the changes before saving.`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "adminToken"
      );

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...form,

        tags: form.tags
          .split(",")
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean),

        sections: form.sections
          .map((section) => ({
            heading:
              section.heading.trim(),

            content:
              section.content.trim(),
          }))
          .filter(
            (section) =>
              section.heading &&
              section.content
          ),

        readTime:
          Number(form.readTime) ||
          5,
      };

      const response = await fetch(
        `${API_URL}/blogs/${id}`,
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

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "adminToken"
        );

        router.push(
          "/login"
        );

        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update blog."
        );
      }

      setMessage(
        "Blog updated successfully."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p role="status" aria-live="polite">Loading blog...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">

      <div className="admin-page-header">

        <div>
          <p className="admin-eyebrow">
            Content Management
          </p>

          <h1>Edit Blog</h1>

          <p>
            Edit the article manually or
            regenerate its content with AI.
          </p>
        </div>

        <Link
          href="/admin/blogs"
          className="admin-secondary-button"
        >
          ← Back to Blogs
        </Link>

      </div>

      {message && (
        <div className="admin-message">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="blog-editor-layout">

          {/* LEFT */}

          <div className="blog-editor-main">

            <section className="blog-editor-card">

              <div className="blog-editor-card-header">
                <h2>Article</h2>

                <p>
                  Edit the main blog
                  information.
                </p>
              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-title">
                  Blog Title
                </label>

                <input id="admin-field-title"
                  className="blog-title-input"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-slug">
                  URL Slug
                </label>

                <input id="admin-field-slug"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-excerpt">
                  Excerpt
                </label>

                <textarea id="admin-field-excerpt"
                  name="excerpt"
                  rows="4"
                  value={form.excerpt}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-introduction">
                  Introduction
                </label>

                <textarea id="admin-field-introduction"
                  name="introduction"
                  rows="7"
                  value={
                    form.introduction
                  }
                  onChange={handleChange}
                  required
                />

              </div>

            </section>


            {/* SECTIONS */}

            <section className="blog-editor-card">

              <div className="blog-editor-card-header">

                <h2>
                  Article Sections
                </h2>

                <p>
                  Edit, remove or add
                  sections.
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
                          Section{" "}
                          {index + 1}
                        </h3>

                        {form.sections.length >
                          1 && (

                          <button
                            type="button"
                            className="blog-remove-section"
                            onClick={() =>
                              removeSection(
                                index
                              )
                            }
                          >
                            Remove
                          </button>

                        )}

                      </div>

                      <input
                        value={
                          section.heading
                        }
                        onChange={(event) =>
                          updateSection(
                            index,
                            "heading",
                            event.target
                              .value
                          )
                        }
                        placeholder="Section heading"
                      />

                      <textarea
                        rows="8"
                        value={
                          section.content
                        }
                        onChange={(event) =>
                          updateSection(
                            index,
                            "content",
                            event.target
                              .value
                          )
                        }
                        placeholder="Section content"
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


            {/* CONCLUSION */}

            <section className="blog-editor-card">

              <div className="blog-editor-card-header">
                <h2>Conclusion</h2>
              </div>

              <div className="blog-form-group">

                <textarea
                  name="conclusion"
                  rows="7"
                  value={form.conclusion}
                  onChange={handleChange}
                  required
                />

              </div>

            </section>

          </div>


          {/* RIGHT */}

          <aside className="blog-editor-sidebar">

            {/* AI */}

            <section className="admin-ai-assistant-card">
              <div className="admin-ai-assistant-header">
                <div className="admin-ai-assistant-title">
                  <span className="admin-ai-badge">Gemini AI</span>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>AI Blog Writer</h3>
                </div>
                <span className="admin-ai-status">Draft Assistant</span>
              </div>

              <p className="admin-ai-assistant-desc">
                Regenerate or expand the draft using Gemini with your updated topic and related software context.
              </p>

              <div className="blog-form-group">
                <label style={{ fontWeight: "600", fontSize: "13px" }}>
                  Blog Topic or Angle
                </label>
                <textarea
                  rows="4"
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target.value
                    )
                  }
                  placeholder="Enter topic to regenerate draft content..."
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
                    <span>Regenerating Draft...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Regenerate with AI</span>
                  </>
                )}
              </button>

              <div className="admin-ai-notice">
                <span>ℹ</span>
                <span>AI changes remain strictly editable in this form and are never published automatically.</span>
              </div>
            </section>


            {/* SETTINGS */}

            <section className="blog-settings-card">

              <h2>
                Article Settings
              </h2>

              <div className="blog-form-group">

                <label htmlFor="admin-field-category">
                  Category
                </label>

                <input id="admin-field-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-coverImage">
                  Cover Image
                </label>

                <input id="admin-field-coverImage"
                  name="coverImage"
                  value={
                    form.coverImage
                  }
                  onChange={handleChange}
                  placeholder="/images/blogs/article.jpg"
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-tags">
                  Tags
                </label>

                <input id="admin-field-tags"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="AI, SaaS, Productivity"
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-author">
                  Author
                </label>

                <input id="admin-field-author"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                />

              </div>

              <div className="blog-form-group">

                <label htmlFor="admin-field-readTime">
                  Read Time
                </label>

                <input id="admin-field-readTime"
                  type="number"
                  min="1"
                  name="readTime"
                  value={form.readTime}
                  onChange={handleChange}
                />

              </div>

            </section>


            {/* PRODUCTS */}

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
                These products are also
                supplied to Gemini during
                regeneration.
              </p>

              <div className="blog-product-selector">

                {products.map(
                  (product) => (

                    <label
                      className="blog-product-option"
                      key={product._id}
                    >

                      <input
                        type="checkbox"
                        checked={
                          form.relatedProducts.includes(
                            product._id
                          )
                        }
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

                  )
                )}

              </div>

            </section>

          </aside>

        </div>


        {/* ACTIONS */}

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
              : "Save Changes"}
          </button>

        </div>

      </form>

    </main>
  );
}