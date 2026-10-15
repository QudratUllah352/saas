const { activeDealFilter } = require("../utils/dealDates");
const { GoogleGenAI } = require("@google/genai");

const Product = require("../models/Product");
const Deal = require("../models/Deal");

// ==========================================
// GEMINI
// ==========================================

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
}) : null;

// Try another model if one is temporarily unavailable
const GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
];

// ==========================================
// MODEL FALLBACK
// ==========================================

async function generateWithFallback(prompt) {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            console.log(
                `Trying Gemini comparison model: ${model}`
            );

            const response =
                await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType:
                            "application/json",
                    },
                });

            console.log(
                `Gemini comparison success: ${model}`
            );

            return {
                response,
                model,
            };
        } catch (error) {
            lastError = error;

            console.log(
                `Gemini model ${model} failed:`,
                error.status || error.message
            );

            // Try another model
            if (
                error.status === 503 ||
                error.status === 404
            ) {
                continue;
            }

            // Quota / billing problem
            if (error.status === 429) {
                throw error;
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

// ==========================================
// CLEAN JSON
// ==========================================

function parseGeminiJSON(text) {
    let cleanText = text.trim();

    // Remove Markdown fences if Gemini adds them
    cleanText = cleanText
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

    return JSON.parse(cleanText);
}

function validateGeneratedComparison(
    generated,
    productAInfo,
    productBInfo
) {
    // AI is not allowed to invent these arrays.
    // Use MongoDB values directly instead.

    generated.productABestFor =
        productAInfo.targetAudience || [];

    generated.productBBestFor =
        productBInfo.targetAudience || [];

    generated.productAStrengths =
        productAInfo.strengths || [];

    generated.productBStrengths =
        productBInfo.strengths || [];

    generated.productALimitations =
        productAInfo.limitations || [];

    generated.productBLimitations =
        productBInfo.limitations || [];

    // Force correct title + slug
    generated.title =
        `${productAInfo.name} vs ${productBInfo.name}`;

    const slugify = (text) =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    generated.slug =
        `${slugify(productAInfo.name)}-vs-${slugify(
            productBInfo.name
        )}`;

    // Clean accidental AI labels
    if (
        Array.isArray(generated.comparisonPoints)
    ) {
        generated.comparisonPoints =
            generated.comparisonPoints.map(
                (point) => ({
                    title: String(
                        point?.title || ""
                    )
                        .replace(/^title:\s*/i, "")
                        .trim(),

                    productA: String(
                        point?.productA || ""
                    )
                        .replace(
                            /^product\s*a:\s*/i,
                            ""
                        )
                        .trim(),

                    productB: String(
                        point?.productB || ""
                    )
                        .replace(
                            /^product\s*b:\s*/i,
                            ""
                        )
                        .trim(),
                })
            );
    }

    return generated;
}

// ==========================================
// GENERATE AI COMPARISON
// ==========================================

const generateComparison =
    async (req, res) => {
  if (!ai) return res.status(503).json({ message: "AI generation is unavailable. Configure GEMINI_API_KEY on the backend." });
        try {
            const {
                productAId,
                productBId,
            } = req.body;

            // ------------------------------------
            // VALIDATION
            // ------------------------------------

            if (!productAId || !productBId) {
                return res.status(400).json({
                    message:
                        "Please select both products.",
                });
            }

            if (productAId === productBId) {
                return res.status(400).json({
                    message:
                        "You cannot compare a product with itself.",
                });
            }

            // ------------------------------------
            // LOAD PRODUCTS
            // ------------------------------------

            const [productA, productB] =
                await Promise.all([
                    Product.findById(productAId)
                        .populate("category"),

                    Product.findById(productBId)
                        .populate("category"),
                ]);

            if (!productA) {
                return res.status(404).json({
                    message:
                        "Product A not found.",
                });
            }

            if (!productB) {
                return res.status(404).json({
                    message:
                        "Product B not found.",
                });
            }

            // ------------------------------------
            // LOAD ACTIVE DEALS
            // ------------------------------------

            const [dealA, dealB] =
                await Promise.all([
                    Deal.findOne({
                        product: productA._id,
                        ...activeDealFilter(),
                    }).sort({
                        createdAt: -1,
                    }),

                    Deal.findOne({
                        product: productB._id,
                        ...activeDealFilter(),
                    }).sort({
                        createdAt: -1,
                    }),
                ]);

            // ------------------------------------
            // PREPARE PRODUCT A
            // ------------------------------------

            const productAInformation = {
                name: productA.name,

                description:
                    productA.description || "",

                shortDescription:
                    productA.shortDescription || "",

                website:
                    productA.website || "",

                category:
                    productA.category?.name || "",

                features:
                    productA.features || [],

                targetAudience:
                    productA.targetAudience || [],

                integrations:
                    productA.integrations || [],

                pricingInfo:
                    productA.pricingInfo || "",

                strengths:
                    productA.strengths || [],

                limitations:
                    productA.limitations || [],

                deal: dealA
                    ? {
                        discount:
                            dealA.discount,

                        price:
                            dealA.price,

                        oldPrice:
                            dealA.oldPrice,

                        dealType:
                            dealA.dealType,
                    }
                    : null,
            };

            // ------------------------------------
            // PREPARE PRODUCT B
            // ------------------------------------

            const productBInformation = {
                name: productB.name,

                description:
                    productB.description || "",

                shortDescription:
                    productB.shortDescription || "",

                website:
                    productB.website || "",

                category:
                    productB.category?.name || "",

                features:
                    productB.features || [],

                targetAudience:
                    productB.targetAudience || [],

                integrations:
                    productB.integrations || [],

                pricingInfo:
                    productB.pricingInfo || "",

                strengths:
                    productB.strengths || [],

                limitations:
                    productB.limitations || [],

                deal: dealB
                    ? {
                        discount:
                            dealB.discount,

                        price:
                            dealB.price,

                        oldPrice:
                            dealB.oldPrice,

                        dealType:
                            dealB.dealType,
                    }
                    : null,
            };

            // ------------------------------------
            // PROMPT
            // ------------------------------------

            const prompt = `
You are an editorial assistant for SaaSpin, a SaaS software discovery and comparison website.

Your task is to create a factual comparison between two software products using ONLY the database information provided below.

==================================================
CRITICAL FACTUAL RULES
==================================================

The supplied PRODUCT A and PRODUCT B data are the ONLY factual sources you may use.

You MUST NOT use:
- your general knowledge
- assumptions based on product names
- information remembered from training data
- external knowledge
- imagined product capabilities
- inferred features

If information is missing, use:

"Not specified in available product data"

Missing information does NOT mean the product lacks that capability.

For example:

WRONG:
"TaskFlow does not have AI features."

CORRECT:
"AI functionality is not specified in the available TaskFlow product data."

WRONG:
"TaskFlow is best for project managers."

CORRECT:
Only list project managers if "Project managers" appears in TaskFlow's supplied targetAudience.

==================================================
DO NOT INVENT
==================================================

Never invent or infer:

- features
- integrations
- pricing
- discounts
- target audiences
- strengths
- limitations
- company history
- launch dates
- customer counts
- popularity
- awards
- reviews
- testimonials
- security certifications
- support methods
- performance claims
- testing results
- market position
- enterprise capabilities
- AI capabilities

==================================================
ARRAY RULES
==================================================

productABestFor:
Use ONLY values supported by PRODUCT A targetAudience.

productBBestFor:
Use ONLY values supported by PRODUCT B targetAudience.

If targetAudience is empty, return [].

productAStrengths:
Use ONLY PRODUCT A strengths.

productBStrengths:
Use ONLY PRODUCT B strengths.

If strengths are empty, return [].

productALimitations:
Use ONLY PRODUCT A limitations.

productBLimitations:
Use ONLY PRODUCT B limitations.

If limitations are empty, return [].

Do NOT transform missing information into a limitation.

==================================================
COMPARISON POINT RULES
==================================================

You may compare:

- description / core purpose
- features
- target audience
- integrations
- pricing
- active deal
- strengths
- limitations

For every comparison point:

"title" must contain ONLY the topic name.

Example:

"title": "AI Task Generation"

NOT:

"title": "Title: AI Task Generation"

The productA field must contain the comparison information only.

Example:

"productA": "Available"

NOT:

"productA": "Product A: Available"

The productB field must follow the same rule.

When information is unavailable, write exactly:

"Not specified in available product data"

Do NOT write:

"Not available"
"Unavailable"
"Does not support"
"Does not have"
"Missing"
"Limited"

unless that fact is explicitly stated in the supplied product information.

==================================================
CONCLUSION RULES
==================================================

The conclusion must:

- summarize documented differences
- explain suitability using documented targetAudience data
- remain neutral
- not declare an overall winner
- not invent recommendations
- clearly acknowledge missing data when one product has less information

==================================================
PRODUCT A
==================================================

${JSON.stringify(productAInformation, null, 2)}

==================================================
PRODUCT B
==================================================

${JSON.stringify(productBInformation, null, 2)}

==================================================
OUTPUT
==================================================

Return VALID JSON ONLY.

Do not return Markdown.
Do not use code fences.
Do not include explanations outside the JSON.

Use exactly this structure:

{
  "title": "${productA.name} vs ${productB.name}",
  "slug": "${productA.slug}-vs-${productB.slug}",

  "excerpt": "A factual short summary based only on supplied product data.",

  "introduction": "Neutral introduction based only on supplied product descriptions.",

  "comparisonPoints": [
    {
      "title": "Comparison topic",
      "productA": "Supported information or Not specified in available product data",
      "productB": "Supported information or Not specified in available product data"
    }
  ],

  "productABestFor": [],
  "productBBestFor": [],

  "productAStrengths": [],
  "productBStrengths": [],

  "productALimitations": [],
  "productBLimitations": [],

  "conclusion": "Neutral factual conclusion.",

  "readTime": 5
}

Generate approximately 4-8 comparison points when the supplied data supports them.

Accuracy is more important than completeness.

If one product contains significantly less information, explicitly acknowledge that limitation in the comparison instead of filling the gaps with assumptions.
`;

            // ------------------------------------
            // GENERATE
            // ------------------------------------

            const { response, model } =
                await generateWithFallback(
                    prompt
                );

            // ------------------------------------
            // GET RESPONSE TEXT
            // ------------------------------------

            const responseText =
                response.text;

            if (!responseText) {
                throw new Error(
                    "Gemini returned an empty response."
                );
            }

            // ------------------------------------
            // PARSE JSON
            // ------------------------------------

            let generatedComparison =
                parseGeminiJSON(responseText);

            generatedComparison =
                validateGeneratedComparison(
                    generatedComparison,
                    productAInformation,
                    productBInformation
                );

            // ------------------------------------
            // RETURN TO FRONTEND
            // ------------------------------------

            res.status(200).json({
                message:
                    "AI comparison generated successfully.",

                model,

                comparison:
                    generatedComparison,
            });
        } catch (error) {
            console.error(
                "AI comparison generation error:",
                error
            );

            // Gemini busy
            if (error.status === 503) {
                return res.status(503).json({
                    message:
                        "Gemini is temporarily busy. Please try again.",
                });
            }

            // Gemini quota
            if (error.status === 429) {
                return res.status(429).json({
                    message:
                        "Gemini API quota has been reached. Please check your API quota and try again.",
                });
            }

            res.status(500).json({
                message:
                    "Could not generate AI comparison.",

                error:
                    error.message,
            });
        }
    };

module.exports = {
    generateComparison,
};