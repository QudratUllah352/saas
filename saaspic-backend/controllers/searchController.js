const { unexpiredDealFilter } = require("../utils/dealDates");
const { categories } = require("../utils/categories");
const Product = require("../models/Product");
const Deal = require("../models/Deal");
const Review = require("../models/Review");
const Comparison = require("../models/Comparison");
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const publicProductSelect =
    require("../utils/publicProductSelect");

const globalSearch = async (req, res) => {
    try {
        // =========================================
        // 1. GET SEARCH QUERY
        // =========================================

        const query = req.query.q?.trim();

        if (!query) {
            return res.json({
                query: "",
                total: 0,
                products: [],
                deals: [],
                reviews: [],
                comparisons: [],
                blogs: [],
            });
        }

        // =========================================
        // 2. CREATE SAFE SEARCH REGEX
        // =========================================

        const escapedQuery = query.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const searchRegex = new RegExp(
            escapedQuery,
            "i"
        );

        // =========================================
        // 3. FIND MATCHING CATEGORIES FIRST
        // =========================================

        const matchingCategories =
            await Category.find({
                $or: [
                    { name: searchRegex },
                    { slug: searchRegex },
                    { slug: { $in: categories.filter((category) => category.aliases.some((alias) => searchRegex.test(alias))).map((category) => category.slug) } },
                ],
            }).select("_id");

        // IMPORTANT:
        // This variable is created BEFORE
        // Promise.all uses it.

        const matchingCategoryIds =
            matchingCategories.map(
                (category) => category._id
            );

        console.log(
            `Searching for "${query}"`
        );

        console.log(
            "Matching categories:",
            matchingCategoryIds.length
        );

        // =========================================
        // 4. SEARCH DATABASE
        // =========================================

        const [
            products,
            deals,
            reviews,
            comparisons,
            blogs,
        ] = await Promise.all([
            // -----------------------------
            // PRODUCTS
            // -----------------------------

            Product.find({
                $or: [
                    {
                        name: searchRegex,
                    },

                    {
                        description: searchRegex,
                    },

                    {
                        shortDescription:
                            searchRegex,
                    },

                    {
                        features: searchRegex,
                    },

                    {
                        targetAudience:
                            searchRegex,
                    },

                    {
                        integrations:
                            searchRegex,
                    },

                    {
                        pricingInfo:
                            searchRegex,
                    },

                    {
                        strengths:
                            searchRegex,
                    },

                    {
                        limitations:
                            searchRegex,
                    },

                    {
                        category: {
                            $in:
                                matchingCategoryIds,
                        },
                    },
                ],
            })
                .select(publicProductSelect)
                .populate(
                    "category",
                    "name slug"
                )
                .limit(10)
                .lean(),

            // -----------------------------
            // DEALS
            // -----------------------------

            Deal.find({
                ...unexpiredDealFilter(),
            })
                .populate({
                    path: "product",
                    select: publicProductSelect,
                    match: {
                        $or: [
                            {
                                name: searchRegex,
                            },

                            {
                                description:
                                    searchRegex,
                            },

                            {
                                shortDescription:
                                    searchRegex,
                            },

                            {
                                features:
                                    searchRegex,
                            },

                            {
                                category: {
                                    $in:
                                        matchingCategoryIds,
                                },
                            },
                        ],
                    },

                    populate: {
                        path: "category",
                        select: "name slug",
                    },
                })
                .sort({
                    createdAt: -1,
                })
                .lean(),

            // -----------------------------
            // REVIEWS
            // -----------------------------

            Review.find({
                isPublished: true,

                $or: [
                    {
                        title: searchRegex,
                    },

                    {
                        excerpt: searchRegex,
                    },

                    {
                        introduction:
                            searchRegex,
                    },

                    {
                        overview: searchRegex,
                    },

                    {
                        quickVerdict:
                            searchRegex,
                    },

                    {
                        verdict: searchRegex,
                    },

                    {
                        targetAudience:
                            searchRegex,
                    },

                    {
                        pros: searchRegex,
                    },

                    {
                        cons: searchRegex,
                    },
                ],
            })
                .populate(
                    "product",
                    "name slug logo"
                )
                .limit(10)
                .lean(),

            // -----------------------------
            // COMPARISONS
            // -----------------------------

            Comparison.find({
                isPublished: true,

                $or: [
                    {
                        title: searchRegex,
                    },

                    {
                        excerpt: searchRegex,
                    },

                    {
                        introduction:
                            searchRegex,
                    },

                    {
                        conclusion:
                            searchRegex,
                    },

                    {
                        productABestFor:
                            searchRegex,
                    },

                    {
                        productBBestFor:
                            searchRegex,
                    },

                    {
                        productAStrengths:
                            searchRegex,
                    },

                    {
                        productBStrengths:
                            searchRegex,
                    },
                ],
            })
                .populate(
                    "productA",
                    "name slug logo"
                )
                .populate(
                    "productB",
                    "name slug logo"
                )
                .limit(10)
                .lean(),

            // -----------------------------
            // BLOGS
            // -----------------------------

            Blog.find({
                isPublished: true,

                $or: [
                    {
                        title: searchRegex,
                    },

                    {
                        excerpt: searchRegex,
                    },

                    {
                        introduction:
                            searchRegex,
                    },

                    {
                        category:
                            searchRegex,
                    },

                    {
                        tags: searchRegex,
                    },

                    {
                        "sections.heading":
                            searchRegex,
                    },

                    {
                        "sections.content":
                            searchRegex,
                    },

                    {
                        conclusion:
                            searchRegex,
                    },
                ],
            })
                .populate(
                    "relatedProducts",
                    "name slug logo"
                )
                .sort({
                    publishedAt: -1,
                    createdAt: -1,
                })
                .limit(10)
                .lean(),
        ]);

        // =========================================
        // 5. REMOVE NON-MATCHING DEALS
        // =========================================

        const matchingDeals = deals
            .filter(
                (deal) => deal.product
            )
            .slice(0, 10);

        // =========================================
        // 6. TOTAL RESULTS
        // =========================================

        const total =
            products.length +
            matchingDeals.length +
            reviews.length +
            comparisons.length +
            blogs.length;

        // =========================================
        // 7. RETURN RESULTS
        // =========================================

        return res.status(200).json({
            query,

            total,

            products,

            deals: matchingDeals,

            reviews,

            comparisons,

            blogs,
        });
    } catch (error) {
        console.error(
            "Global search error:",
            error
        );

        return res.status(500).json({
            message:
                "Error performing search.",

        });
    }
};

module.exports = {
    globalSearch,
};