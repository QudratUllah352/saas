const Comparison = require("../models/Comparison");
const Product = require("../models/Product");
const publicProductSelect =
    require("../utils/publicProductSelect");

// ==========================================
// CREATE COMPARISON - ADMIN
// ==========================================

const createComparison = async (req, res) => {
    try {
        const {
            title,
            slug,
            productA,
            productB,
            excerpt,
            introduction,
            comparisonPoints,
            productABestFor,
            productBBestFor,
            productAStrengths,
            productBStrengths,
            productALimitations,
            productBLimitations,
            conclusion,
            author,
            readTime,
        } = req.body;

        // Required fields
        if (
            !title ||
            !slug ||
            !productA ||
            !productB ||
            !excerpt ||
            !introduction ||
            !conclusion
        ) {
            return res.status(400).json({
                message:
                    "Please provide all required comparison fields",
            });
        }

        // Products cannot be the same
        if (productA === productB) {
            return res.status(400).json({
                message:
                    "You cannot compare a product with itself",
            });
        }

        // Check both products exist
        const [firstProduct, secondProduct] =
            await Promise.all([
                Product.findById(productA),
                Product.findById(productB),
            ]);

        if (!firstProduct) {
            return res.status(404).json({
                message: "Product A not found",
            });
        }

        if (!secondProduct) {
            return res.status(404).json({
                message: "Product B not found",
            });
        }

        // Check duplicate slug
        const existingComparison =
            await Comparison.findOne({
                slug: slug.toLowerCase(),
            });

        if (existingComparison) {
            return res.status(400).json({
                message:
                    "A comparison with this slug already exists",
            });
        }

        const comparison =
            await Comparison.create({
                title,
                slug: slug.toLowerCase(),
                productA,
                productB,
                excerpt,
                introduction,

                comparisonPoints:
                    comparisonPoints || [],

                productABestFor:
                    productABestFor || [],

                productBBestFor:
                    productBBestFor || [],

                productAStrengths:
                    productAStrengths || [],

                productBStrengths:
                    productBStrengths || [],

                productALimitations:
                    productALimitations || [],

                productBLimitations:
                    productBLimitations || [],

                conclusion,

                author:
                    author || "SaaSpin Team",

                readTime:
                    Number(readTime) || 5,

                isPublished: false,
                publishedAt: null,
            });

        const populatedComparison =
            await populateComparison(
                comparison._id
            );

        res.status(201).json({
            message:
                "Comparison draft created successfully",
            comparison: populatedComparison,
        });
    } catch (error) {
        res.status(400).json({
            message:
                "Could not create comparison",
            error: error.message,
        });
    }
};

// ==========================================
// PUBLIC - GET PUBLISHED COMPARISONS
// ==========================================

const getComparisons = async (req, res) => {
    try {
        const comparisons =
            await Comparison.find({
                isPublished: true,
            })

                .populate({
                    path: "productA",
                    select: publicProductSelect,
                    populate: {
                        path: "category",
                    },
                })

                .populate({
                    path: "productB",
                    select: publicProductSelect,
                    populate: {
                        path: "category",
                    },
                })

                .sort({
                    publishedAt: -1,
                });

        return res
            .status(200)
            .json(comparisons);

    } catch (error) {
        console.error(
            "Get comparisons error:",
            error
        );

        return res.status(500).json({
            message:
                "Could not fetch comparisons",
        });
    }
};

// ==========================================
// PUBLIC - GET COMPARISON BY SLUG
// ==========================================

const getComparisonBySlug = async (
    req,
    res
) => {
    try {
        const comparison =
            await Comparison.findOne({
                slug: req.params.slug,
                isPublished: true,
            })

                .populate({
                    path: "productA",
                    select: publicProductSelect,
                    populate: {
                        path: "category",
                    },
                })

                .populate({
                    path: "productB",
                    select: publicProductSelect,
                    populate: {
                        path: "category",
                    },
                });

        if (!comparison) {
            return res.status(404).json({
                message:
                    "Comparison not found.",
            });
        }

        return res
            .status(200)
            .json(comparison);

    } catch (error) {
        console.error(
            "Get comparison error:",
            error
        );

        return res.status(500).json({
            message:
                "Could not fetch comparison.",
        });
    }
};

// ==========================================
// ADMIN - GET ALL COMPARISONS
// ==========================================

const getAllComparisonsAdmin =
    async (req, res) => {
        try {
            const comparisons =
                await Comparison.find()
                    .populate({
                        path: "productA",
                        populate: {
                            path: "category",
                        },
                    })
                    .populate({
                        path: "productB",
                        populate: {
                            path: "category",
                        },
                    })
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json(comparisons);
        } catch (error) {
            res.status(500).json({
                message:
                    "Could not fetch admin comparisons",
                error: error.message,
            });
        }
    };

// ==========================================
// ADMIN - GET SINGLE COMPARISON
// ==========================================

const getComparisonByIdAdmin =
    async (req, res) => {
        try {
            const comparison =
                await populateComparison(
                    req.params.id
                );

            if (!comparison) {
                return res.status(404).json({
                    message:
                        "Comparison not found",
                });
            }

            res.status(200).json(comparison);
        } catch (error) {
            res.status(400).json({
                message:
                    "Could not fetch comparison",
                error: error.message,
            });
        }
    };

// ==========================================
// ADMIN - UPDATE COMPARISON
// ==========================================

const updateComparison =
    async (req, res) => {
        try {
            const comparison =
                await Comparison.findById(
                    req.params.id
                );

            if (!comparison) {
                return res.status(404).json({
                    message:
                        "Comparison not found",
                });
            }

        if (req.body.lastKnownUpdatedAt && comparison.updatedAt) {
            const clientDate = new Date(req.body.lastKnownUpdatedAt).getTime();
            const serverDate = new Date(comparison.updatedAt).getTime();
            if (Math.abs(serverDate - clientDate) > 1000) {
                return res.status(409).json({
                    message: "Conflict detected: this comparison was modified by another user while you were editing. Please refresh to view latest changes.",
                    conflict: true,
                    serverUpdatedAt: comparison.updatedAt,
                });
            }
        }

            const productA =
                req.body.productA ||
                comparison.productA.toString();

            const productB =
                req.body.productB ||
                comparison.productB.toString();

            if (
                productA.toString() ===
                productB.toString()
            ) {
                return res.status(400).json({
                    message:
                        "You cannot compare a product with itself",
                });
            }

            // Validate changed products
            if (req.body.productA) {
                const exists =
                    await Product.findById(
                        req.body.productA
                    );

                if (!exists) {
                    return res.status(404).json({
                        message:
                            "Product A not found",
                    });
                }
            }

            if (req.body.productB) {
                const exists =
                    await Product.findById(
                        req.body.productB
                    );

                if (!exists) {
                    return res.status(404).json({
                        message:
                            "Product B not found",
                    });
                }
            }

            // Prevent duplicate slug
            if (req.body.slug) {
                const duplicate =
                    await Comparison.findOne({
                        slug:
                            req.body.slug.toLowerCase(),
                        _id: {
                            $ne: comparison._id,
                        },
                    });

                if (duplicate) {
                    return res.status(400).json({
                        message:
                            "A comparison with this slug already exists",
                    });
                }
            }

            const allowedFields = [
                "title",
                "slug",
                "productA",
                "productB",
                "excerpt",
                "introduction",
                "comparisonPoints",
                "productABestFor",
                "productBBestFor",
                "productAStrengths",
                "productBStrengths",
                "productALimitations",
                "productBLimitations",
                "conclusion",
                "author",
                "readTime",
            ];

            allowedFields.forEach((field) => {
                if (
                    req.body[field] !== undefined
                ) {
                    comparison[field] =
                        req.body[field];
                }
            });

            if (req.body.slug) {
                comparison.slug =
                    req.body.slug.toLowerCase();
            }

            if (
                req.body.readTime !== undefined
            ) {
                comparison.readTime =
                    Number(req.body.readTime);
            }

            await comparison.save();

            const updatedComparison =
                await populateComparison(
                    comparison._id
                );

            res.status(200).json({
                message:
                    "Comparison updated successfully",
                comparison:
                    updatedComparison,
            });
        } catch (error) {
            res.status(400).json({
                message:
                    "Could not update comparison",
                error: error.message,
            });
        }
    };

// ==========================================
// ADMIN - PUBLISH / UNPUBLISH
// ==========================================

const toggleComparisonPublish =
    async (req, res) => {
        try {
            const comparison =
                await Comparison.findById(
                    req.params.id
                );

            if (!comparison) {
                return res.status(404).json({
                    message:
                        "Comparison not found",
                });
            }

            comparison.isPublished =
                !comparison.isPublished;

            comparison.publishedAt =
                comparison.isPublished
                    ? new Date()
                    : null;

            await comparison.save();

            const updatedComparison =
                await populateComparison(
                    comparison._id
                );

            res.status(200).json({
                message:
                    comparison.isPublished
                        ? "Comparison published successfully"
                        : "Comparison moved to draft",
                comparison:
                    updatedComparison,
            });
        } catch (error) {
            res.status(400).json({
                message:
                    "Could not change comparison status",
                error: error.message,
            });
        }
    };

// ==========================================
// ADMIN - DELETE
// ==========================================

const deleteComparison =
    async (req, res) => {
        try {
            const comparison =
                await Comparison.findById(
                    req.params.id
                );

            if (!comparison) {
                return res.status(404).json({
                    message:
                        "Comparison not found",
                });
            }

            await comparison.deleteOne();

            res.status(200).json({
                message:
                    "Comparison deleted successfully",
                id: req.params.id,
            });
        } catch (error) {
            res.status(400).json({
                message:
                    "Could not delete comparison",
                error: error.message,
            });
        }
    };

// ==========================================
// HELPER
// ==========================================

async function populateComparison(id) {
    return Comparison.findById(id)
        .populate({
            path: "productA",
            populate: {
                path: "category",
                select: "name slug",
            },
        })
        .populate({
            path: "productB",
            populate: {
                path: "category",
                select: "name slug",
            },
        });
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createComparison,
    getComparisons,
    getComparisonBySlug,
    getAllComparisonsAdmin,
    getComparisonByIdAdmin,
    updateComparison,
    toggleComparisonPublish,
    deleteComparison,
};