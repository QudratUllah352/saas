const { activeDealFilter } = require("../utils/dealDates");
const { GoogleGenAI } =
  require("@google/genai");

const Product =
  require("../models/Product");

const Deal =
  require("../models/Deal");

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
}) : null;

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

async function generateWithFallback(
  prompt,
  config = {}
) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(
        `Trying Gemini model: ${model}`
      );

      const response =
        await ai.models.generateContent({
          model,
          contents: prompt,

          config: {
            responseMimeType:
              "application/json",
            ...config,
          },
        });

      console.log(
        `Gemini success: ${model}`
      );

      return {
        response,
        model,
      };
    } catch (error) {
      lastError = error;

      console.log(
        `Gemini model ${model} failed:`,
        error.status ||
          error.message
      );

      if (
        error.status === 503 ||
        error.status === 404
      ) {
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new Error(
      "No Gemini model was available."
    )
  );
}

function parseGeminiJSON(text) {
  let cleaned = String(text || "")
    .trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==========================================
// GENERATE BLOG WITH AI
// ==========================================

const generateBlog = async (
  req,
  res
) => {
  if (!ai) return res.status(503).json({ message: "AI generation is unavailable. Configure GEMINI_API_KEY on the backend." });
  try {
    const {
      topic,
      category,
      productIds,
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message:
          "Please enter a blog topic.",
      });
    }

    const ids =
      Array.isArray(productIds)
        ? productIds
        : [];

    // =====================================
    // LOAD RELATED PRODUCTS
    // =====================================

    const products =
      ids.length > 0
        ? await Product.find({
            _id: { $in: ids },
          }).populate(
            "category",
            "name slug"
          )
        : [];

    if (
      ids.length > 0 &&
      products.length !== ids.length
    ) {
      return res.status(400).json({
        message:
          "One or more selected products are invalid.",
      });
    }

    // =====================================
    // LOAD ACTIVE DEALS
    // =====================================

    const productInformation =
      await Promise.all(
        products.map(
          async (product) => {
            const deal =
              await Deal.findOne({
                product: product._id,
                ...activeDealFilter(),
              }).sort({
                createdAt: -1,
              });

            return {
              id: product._id.toString(),

              name: product.name,

              slug: product.slug,

              description:
                product.description ||
                "",

              shortDescription:
                product.shortDescription ||
                "",

              website:
                product.website || "",

              category:
                product.category?.name ||
                "",

              features:
                product.features || [],

              targetAudience:
                product.targetAudience ||
                [],

              integrations:
                product.integrations ||
                [],

              pricingInfo:
                product.pricingInfo ||
                "",

              strengths:
                product.strengths || [],

              limitations:
                product.limitations ||
                [],

              activeDeal: deal
                ? {
                    discount:
                      deal.discount,

                    price:
                      deal.price,

                    oldPrice:
                      deal.oldPrice,

                    dealType:
                      deal.dealType,
                  }
                : null,
            };
          }
        )
      );

    // =====================================
    // PROMPT
    // =====================================

    const prompt = `
You are an editorial assistant for SaaSpin, a SaaS software discovery website.

Create a useful structured blog draft.

BLOG TOPIC:
${topic}

BLOG CATEGORY:
${category || "SaaS"}

==================================================
FACTUAL RULES
==================================================

When discussing any selected software product, the supplied PRODUCT DATA below is the ONLY factual source you may use for claims about that product.

Do NOT use external knowledge about selected products.

Do NOT invent or infer:

- product features
- integrations
- prices
- discounts
- target audiences
- strengths
- limitations
- customer numbers
- awards
- company history
- testimonials
- support channels
- security certifications
- performance claims
- test results
- popularity
- market share

If product information is missing, do not fill the gap with assumptions.

You may write general educational explanations necessary to explain the blog topic, but do not present unsupported statements about selected products as facts.

If the topic asks for information that the supplied product data cannot support, keep that portion general or explicitly state that the available product information does not specify it.

==================================================
SELECTED PRODUCT DATA
==================================================

${JSON.stringify(
  productInformation,
  null,
  2
)}

==================================================
WRITING RULES
==================================================

Write for people researching SaaS software.

The article should be:

- clear
- educational
- useful
- neutral
- easy to scan
- original
- professionally written

Avoid:

- fake quotes
- fake statistics
- unsupported superlatives
- fake testing claims
- exaggerated marketing language
- declaring a product "best" without defined factual criteria
- claiming SaaSpin personally tested something unless explicitly supplied

The introduction should explain what the reader will learn.

Each section should have a useful heading and substantial content.

The conclusion should summarize the article without inventing new facts.

Generate approximately 4 to 7 sections when appropriate.

==================================================
OUTPUT
==================================================

Return VALID JSON ONLY.

Do not return Markdown.
Do not return code fences.
Do not include commentary outside JSON.

Use exactly this structure:

{
  "title": "Blog title",
  "slug": "blog-slug",
  "excerpt": "Short blog summary",
  "introduction": "Introduction",
  "category": "${category || "SaaS"}",
  "tags": [
    "tag one",
    "tag two"
  ],
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content"
    }
  ],
  "conclusion": "Blog conclusion",
  "readTime": 5
}
`;

    // =====================================
    // CALL GEMINI
    // =====================================

    const {
      response,
      model,
    } =
      await generateWithFallback(
        prompt
      );

    const responseText =
      response.text;

    let blog =
      parseGeminiJSON(
        responseText
      );

    // =====================================
    // SERVER-SIDE CLEANUP
    // =====================================

    blog.title =
      String(
        blog.title || topic
      ).trim();

    blog.slug =
      slugify(
        blog.slug ||
          blog.title ||
          topic
      );

    blog.excerpt =
      String(
        blog.excerpt || ""
      ).trim();

    blog.introduction =
      String(
        blog.introduction || ""
      ).trim();

    blog.category =
      String(
        category ||
          blog.category ||
          "SaaS"
      ).trim();

    blog.tags =
      Array.isArray(blog.tags)
        ? blog.tags
            .map((tag) =>
              String(tag).trim()
            )
            .filter(Boolean)
        : [];

    blog.sections =
      Array.isArray(blog.sections)
        ? blog.sections
            .map((section) => ({
              heading: String(
                section?.heading ||
                  ""
              ).trim(),

              content: String(
                section?.content ||
                  ""
              ).trim(),
            }))
            .filter(
              (section) =>
                section.heading &&
                section.content
            )
        : [];

    blog.conclusion =
      String(
        blog.conclusion || ""
      ).trim();

    const generatedReadTime =
      Number(blog.readTime);

    blog.readTime =
      Number.isFinite(
        generatedReadTime
      ) &&
      generatedReadTime >= 1
        ? Math.round(
            generatedReadTime
          )
        : 5;

    // Never let AI decide these database fields.

    blog.relatedProducts =
      ids;

    blog.author =
      "SaaSpin Team";

    blog.isPublished =
      false;

    blog.publishedAt =
      null;

    res.json({
      message:
        "AI blog draft generated successfully.",

      model,

      blog,
    });
  } catch (error) {
    console.error(
      "AI blog generation error:",
      error
    );

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "Gemini usage limit reached. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "Gemini is temporarily busy. Please try again.",
      });
    }

    res.status(500).json({
      message:
        "Could not generate blog with AI.",

      error: error.message,
    });
  }
};

module.exports = {
  generateBlog,
  generateWithFallback,
  parseGeminiJSON,
};
