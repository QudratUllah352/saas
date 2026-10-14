const { activeDealFilter } = require("../utils/dealDates");
const { GoogleGenAI } = require("@google/genai");

const Product = require("../models/Product");
const Deal = require("../models/Deal");

// ======================================================
// CHECK GEMINI API KEY
// ======================================================

if (!process.env.GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY is missing from the backend .env file"
    );
}

// ======================================================
// GEMINI CLIENT
// ======================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// ======================================================
// GEMINI MODEL FALLBACK
// ======================================================

const GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
];

// ======================================================
// GENERATE USING AVAILABLE MODEL
// ======================================================

async function generateWithFallback(prompt) {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`Trying Gemini model: ${model}`);

            const response = await ai.models.generateContent({
                model,
                contents: prompt,

                config: {
                    responseMimeType: "application/json",
                },
            });

            console.log(`Gemini success: ${model}`);

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

            // 503 = model overloaded
            // Try the next model
            if (error.status === 503) {
                console.log(
                    `${model} is busy. Trying fallback model...`
                );

                continue;
            }

            // 404 = model unavailable
            // Try the next model
            if (error.status === 404) {
                console.log(
                    `${model} is unavailable. Trying fallback model...`
                );

                continue;
            }

            // 429 can mean free-tier/rate limit.
            // Trying another model may also be rate limited,
            // so return the error instead of hammering the API.
            if (error.status === 429) {
                throw error;
            }

            // Authentication or other errors should not
            // cause requests to every model.
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

// ======================================================
// GENERATE REVIEW
// ======================================================

const generateReview = async (req, res) => {
    try {
        const { productId } = req.body;

        // ==================================================
        // 1. VALIDATE PRODUCT ID
        // ==================================================

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
            });
        }

        // ==================================================
        // 2. FIND PRODUCT
        // ==================================================

        const product = await Product.findById(
            productId
        ).populate("category");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // ==================================================
        // 3. FIND ACTIVE DEAL
        // ==================================================

        const deal = await Deal.findOne({
            product: product._id,
            ...activeDealFilter(),
        });

        // ==================================================
        // 4. BUILD FACTUAL PRODUCT INFORMATION
        // ==================================================

        const productInformation = {
            name: product.name,

            description:
                product.description || "",

            shortDescription:
                product.shortDescription || "",

            website:
                product.website || "",

            category:
                product.category?.name || "",

            features:
                product.features || [],

            targetAudience:
                product.targetAudience || [],

            integrations:
                product.integrations || [],

            pricingInfo:
                product.pricingInfo || "",

            strengths:
                product.strengths || [],

            limitations:
                product.limitations || [],

            deal: deal
                ? {
                    discount: deal.discount,
                    price: deal.price,
                    oldPrice: deal.oldPrice,
                    dealType: deal.dealType,
                }
                : null,
        };

        // ==================================================
        // 5. CREATE AI PROMPT
        // ==================================================

        const prompt = `
You are preparing an editorial SaaS review draft.

The PRODUCT INFORMATION below is the authoritative factual
source for this review.

You may explain and organize the supplied information, but
you must not invent missing product facts.

PRODUCT INFORMATION:

${JSON.stringify(productInformation, null, 2)}

FACTUAL RULES:

- Only describe a feature as available if it appears in features.
- Only mention an integration if it appears in integrations.
- Only state pricing information supplied in pricingInfo or deal.
- Only state a discount when supplied in deal.
- Use the supplied targetAudience when discussing intended users.
- Use strengths and limitations as editorial inputs.
- Do not invent customer numbers.
- Do not invent company history.
- Do not invent awards.
- Do not invent testimonials.
- Do not invent support channels.
- Do not claim hands-on testing unless testing information was supplied.
- Do not present editorial ratings as customer ratings.

If a field is empty, do not guess its factual contents.

Return ONLY valid JSON.

Do not include Markdown.
Do not include code fences.
Do not include commentary outside the JSON.

Use exactly this structure:

{
  "title": "",
  "slug": "",
  "excerpt": "",
  "introduction": "",
  "overallRating": 0,

  "ratingBreakdown": {
    "features": 0,
    "easeOfUse": 0,
    "valueForMoney": 0,
    "support": 0
  },

  "quickVerdict": "",
  "topPros": [],
  "biggestLimitation": "",
  "overview": "",
  "targetAudience": [],

  "features": [
    {
      "title": "",
      "description": ""
    }
  ],

  "pricingPlans": [],
  "pros": [],
  "cons": [],
  "verdict": "",
  "author": "SaaSPic Team",
  "readTime": 5
}

All ratings must be between 0 and 5.

Create a lowercase URL-safe slug from the title.

If pricing information is insufficient for structured pricing
plans, return:

"pricingPlans": []

Return valid JSON only.
`;

        // ==================================================
        // 6. SEND REQUEST TO GEMINI
        // ==================================================

        const {
            response,
            model: usedModel,
        } = await generateWithFallback(prompt);

        // ==================================================
        // 7. GET RESPONSE TEXT
        // ==================================================

        let text =
            response.text?.trim();

        if (!text) {
            return res.status(500).json({
                message:
                    "Gemini did not return review content.",
            });
        }

        // ==================================================
        // 8. REMOVE CODE FENCES IF THEY APPEAR
        // ==================================================

        text = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        // ==================================================
        // 9. PARSE JSON
        // ==================================================

        let generatedReview;

        try {
            generatedReview =
                JSON.parse(text);
        } catch (parseError) {
            console.error(
                "Could not parse Gemini JSON:"
            );

            console.error(text);

            return res.status(500).json({
                message:
                    "Gemini returned invalid review data. Please try again.",
            });
        }

        // ==================================================
        // 10. BASIC RESPONSE VALIDATION
        // ==================================================

        if (
            !generatedReview.title ||
            !generatedReview.slug ||
            !generatedReview.excerpt ||
            !generatedReview.introduction ||
            !generatedReview.quickVerdict ||
            !generatedReview.overview ||
            !generatedReview.verdict
        ) {
            return res.status(500).json({
                message:
                    "Gemini returned incomplete review data. Please try again.",
            });
        }

        // ==================================================
        // 11. MAKE SURE ARRAYS EXIST
        // ==================================================

        generatedReview.topPros =
            Array.isArray(
                generatedReview.topPros
            )
                ? generatedReview.topPros
                : [];

        generatedReview.targetAudience =
            Array.isArray(
                generatedReview.targetAudience
            )
                ? generatedReview.targetAudience
                : [];

        generatedReview.features =
            Array.isArray(
                generatedReview.features
            )
                ? generatedReview.features
                : [];

        generatedReview.pricingPlans =
            Array.isArray(
                generatedReview.pricingPlans
            )
                ? generatedReview.pricingPlans
                : [];

        generatedReview.pros =
            Array.isArray(
                generatedReview.pros
            )
                ? generatedReview.pros
                : [];

        generatedReview.cons =
            Array.isArray(
                generatedReview.cons
            )
                ? generatedReview.cons
                : [];

        // ==================================================
        // 12. SAFE RATING VALUES
        // ==================================================

        const clampRating = (value) => {
            const number =
                Number(value);

            if (Number.isNaN(number)) {
                return 0;
            }

            return Math.min(
                5,
                Math.max(0, number)
            );
        };

        generatedReview.overallRating =
            clampRating(
                generatedReview.overallRating
            );

        generatedReview.ratingBreakdown = {
            features:
                clampRating(
                    generatedReview
                        .ratingBreakdown
                        ?.features
                ),

            easeOfUse:
                clampRating(
                    generatedReview
                        .ratingBreakdown
                        ?.easeOfUse
                ),

            valueForMoney:
                clampRating(
                    generatedReview
                        .ratingBreakdown
                        ?.valueForMoney
                ),

            support:
                clampRating(
                    generatedReview
                        .ratingBreakdown
                        ?.support
                ),
        };

        // ==================================================
        // 13. SAFE READ TIME
        // ==================================================

        generatedReview.readTime =
            Math.max(
                1,
                Number(
                    generatedReview.readTime
                ) || 5
            );

        // ==================================================
        // 14. RETURN REVIEW TO FRONTEND
        // ==================================================

        return res.status(200).json({
            message:
                "Review draft generated successfully",

            aiModel: usedModel,

            product: productInformation,

            dealId:
                deal?._id || null,

            review:
                generatedReview,
        });
    } catch (error) {
        // ==================================================
        // ERROR HANDLING
        // ==================================================

        console.error(
            "AI review generation error:",
            error.message
        );

        // Gemini temporarily overloaded
        if (error.status === 503) {
            return res.status(503).json({
                message:
                    "Gemini is currently busy because of high demand. Please wait a moment and try Generate Review again.",
            });
        }

        // Rate limit
        if (error.status === 429) {
            return res.status(429).json({
                message:
                    "Gemini API rate limit reached. Please wait and try again.",
            });
        }

        // Authentication problems
        if (
            error.status === 401 ||
            error.status === 403
        ) {
            return res
                .status(error.status)
                .json({
                    message:
                        "Gemini API authentication failed. Check your GEMINI_API_KEY.",
                });
        }

        // Model not found
        if (error.status === 404) {
            return res.status(404).json({
                message:
                    "The configured Gemini model is unavailable. Check the model name in aiReviewController.js.",
            });
        }

        // Other errors
        return res.status(500).json({
            message:
                "Could not generate review",

            error:
                error.message,
        });
    }
};

module.exports = {
    generateReview,
};