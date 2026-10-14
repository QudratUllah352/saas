const { activeDealFilter } = require("../utils/dealDates");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Deal = require("../models/Deal");
const publicProductSelect =
    require("../utils/publicProductSelect");


// ==========================================
// CREATE REVIEW - ADMIN
// ==========================================

const createReview = async (req, res) => {
    try {
        const {
            product,
            deal,
            title,
            slug,
            excerpt,
            introduction,
            overallRating,
            ratingBreakdown,
            quickVerdict,
            topPros,
            biggestLimitation,
            overview,
            targetAudience,
            features,
            pricingPlans,
            pros,
            cons,
            alternatives,
            verdict,
            author,
            readTime,
        } = req.body;

        // Check required fields
        if (
            !product ||
            !title ||
            !slug ||
            !excerpt ||
            !introduction ||
            overallRating === undefined ||
            !quickVerdict ||
            !overview ||
            !verdict
        ) {
            return res.status(400).json({
                message: "Please provide all required review fields",
            });
        }

        // Check product
        const productExists =
            await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // Check deal if provided
        if (deal) {
            const dealExists =
                await Deal.findById(deal);

            if (!dealExists) {
                return res.status(404).json({
                    message: "Deal not found",
                });
            }

            // Make sure deal belongs to product
            if (
                dealExists.product.toString() !==
                product.toString()
            ) {
                return res.status(400).json({
                    message:
                        "Selected deal does not belong to this product",
                });
            }
        }

        // Check duplicate slug
        const existingSlug =
            await Review.findOne({
                slug: slug.toLowerCase(),
            });

        if (existingSlug) {
            return res.status(400).json({
                message:
                    "A review with this slug already exists",
            });
        }

        const review =
            await Review.create({
                product,
                deal: deal || null,
                title,
                slug: slug.toLowerCase(),
                excerpt,
                introduction,
                overallRating: Number(overallRating),
                ratingBreakdown:
                    ratingBreakdown || {},
                quickVerdict,
                topPros: topPros || [],
                biggestLimitation:
                    biggestLimitation || "",
                overview,
                targetAudience:
                    targetAudience || [],
                features: features || [],
                pricingPlans:
                    pricingPlans || [],
                pros: pros || [],
                cons: cons || [],
                alternatives:
                    alternatives || [],
                verdict,
                author:
                    author || "SaaSPin Team",
                readTime:
                    Number(readTime) || 5,

                // New reviews start as drafts
                isPublished: false,
                publishedAt: null,
            });

        const populatedReview =
            await populateReview(review._id);

        res.status(201).json({
            message:
                "Review draft created successfully",
            review: populatedReview,
        });

    } catch (error) {
        res.status(400).json({
            message: "Could not create review",
            error: error.message,
        });
    }
};


// ==========================================
// PUBLIC - GET PUBLISHED REVIEWS
// ==========================================

const getReviews = async (req, res) => {
    try {
        const reviews =
            await Review.find({
                isPublished: true,
            })
                .populate({
                    path: "product",
                    select: publicProductSelect,
                    populate: {
                        path: "category",
                    },
                })

                .populate("deal")

                .populate({
                    path: "alternatives",
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
            .json(reviews);

    } catch (error) {
        console.error(
            "Get reviews error:",
            error
        );

        return res.status(500).json({
            message:
                "Could not fetch reviews",
        });
    }
};


// ==========================================
// PUBLIC - GET REVIEW BY SLUG
// ==========================================

const getReviewBySlug =
    async (req, res) => {
        try {
            const review =
                await Review.findOne({
                    slug: req.params.slug,
                    isPublished: true,
                })
                    .populate({
                        path: "product",
                        select: publicProductSelect,
                        populate: {
                            path: "category",
                        },
                    })
                    .populate({
                        path: "deal",
                        match: {
                            ...activeDealFilter(),
                        },
                        populate: {
                            path: "product",
                            select: publicProductSelect,
                        },
                    })
                    .populate({
                        path: "alternatives",
                        select: publicProductSelect,
                        populate: {
                            path: "category",
                        },
                    });

            if (!review) {
                return res.status(404).json({
                    message: "Review not found",
                });
            }

            res.status(200).json(review);

        } catch (error) {
            res.status(400).json({
                message:
                    "Could not fetch review",
            });
        }
    };



// ==========================================
// ADMIN - GET ALL REVIEWS
// ==========================================

const getAllReviewsAdmin =
    async (req, res) => {
        try {
            const reviews =
                await Review.find()
                    .populate({
                        path: "product",
                        populate: {
                            path: "category",
                        },
                    })
                    .populate("deal")
                    .populate(
                        "alternatives",
                        "name slug logo"
                    )
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json(reviews);

        } catch (error) {
            res.status(500).json({
                message:
                    "Could not fetch admin reviews",
                error: error.message,
            });
        }
    };


// ==========================================
// ADMIN - GET SINGLE REVIEW
// ==========================================

const getReviewByIdAdmin =
    async (req, res) => {
        try {
            const review =
                await populateReview(
                    req.params.id
                );

            if (!review) {
                return res.status(404).json({
                    message: "Review not found",
                });
            }

            res.status(200).json(review);

        } catch (error) {
            res.status(400).json({
                message:
                    "Could not fetch review",
                error: error.message,
            });
        }
    };


// ==========================================
// ADMIN - UPDATE REVIEW
// ==========================================

const updateReview =
    async (req, res) => {
        try {
            const review =
                await Review.findById(
                    req.params.id
                );

            if (!review) {
                return res.status(404).json({
                    message: "Review not found",
                });
            }

        if (req.body.lastKnownUpdatedAt && review.updatedAt) {
            const clientDate = new Date(req.body.lastKnownUpdatedAt).getTime();
            const serverDate = new Date(review.updatedAt).getTime();
            if (Math.abs(serverDate - clientDate) > 1000) {
                return res.status(409).json({
                    message: "Conflict detected: this review was modified by another user while you were editing. Please refresh to view latest changes.",
                    conflict: true,
                    serverUpdatedAt: review.updatedAt,
                });
            }
        }

            const selectedProduct =
                req.body.product || review.product;

            if (req.body.product) {
                const productExists =
                    await Product.findById(
                        req.body.product
                    );

                if (!productExists) {
                    return res.status(404).json({
                        message: "Product not found",
                    });
                }
            }

            if (req.body.deal) {
                const dealExists =
                    await Deal.findById(
                        req.body.deal
                    );

                if (!dealExists) {
                    return res.status(404).json({
                        message: "Deal not found",
                    });
                }

                if (
                    dealExists.product.toString() !==
                    selectedProduct.toString()
                ) {
                    return res.status(400).json({
                        message:
                            "Selected deal does not belong to this product",
                    });
                }
            }

            const allowedFields = [
                "product",
                "deal",
                "title",
                "slug",
                "excerpt",
                "introduction",
                "overallRating",
                "ratingBreakdown",
                "quickVerdict",
                "topPros",
                "biggestLimitation",
                "overview",
                "targetAudience",
                "features",
                "pricingPlans",
                "pros",
                "cons",
                "alternatives",
                "verdict",
                "author",
                "readTime",
            ];

            allowedFields.forEach(
                (field) => {
                    if (
                        req.body[field] !==
                        undefined
                    ) {
                        review[field] =
                            req.body[field];
                    }
                }
            );

            if (
                req.body.overallRating !==
                undefined
            ) {
                review.overallRating =
                    Number(
                        req.body.overallRating
                    );
            }

            if (
                req.body.readTime !==
                undefined
            ) {
                review.readTime =
                    Number(req.body.readTime);
            }

            await review.save();

            const updatedReview =
                await populateReview(
                    review._id
                );

            res.status(200).json({
                message:
                    "Review updated successfully",
                review: updatedReview,
            });

        } catch (error) {
            res.status(400).json({
                message:
                    "Could not update review",
                error: error.message,
            });
        }
    };


// ==========================================
// ADMIN - PUBLISH / UNPUBLISH
// ==========================================

const toggleReviewPublish =
    async (req, res) => {
        try {
            const review =
                await Review.findById(
                    req.params.id
                );

            if (!review) {
                return res.status(404).json({
                    message: "Review not found",
                });
            }

            review.isPublished =
                !review.isPublished;

            if (review.isPublished) {
                review.publishedAt =
                    new Date();
            } else {
                review.publishedAt =
                    null;
            }

            await review.save();

            const updatedReview =
                await populateReview(
                    review._id
                );

            res.status(200).json({
                message:
                    review.isPublished
                        ? "Review published successfully"
                        : "Review moved to draft",
                review: updatedReview,
            });

        } catch (error) {
            res.status(400).json({
                message:
                    "Could not change review status",
                error: error.message,
            });
        }
    };


// ==========================================
// ADMIN - DELETE REVIEW
// ==========================================

const deleteReview =
    async (req, res) => {
        try {
            const review =
                await Review.findById(
                    req.params.id
                );

            if (!review) {
                return res.status(404).json({
                    message: "Review not found",
                });
            }

            await review.deleteOne();

            res.status(200).json({
                message:
                    "Review deleted successfully",
                id: req.params.id,
            });

        } catch (error) {
            res.status(400).json({
                message:
                    "Could not delete review",
                error: error.message,
            });
        }
    };


// ==========================================
// HELPER - POPULATE REVIEW
// ==========================================

async function populateReview(id) {
    return Review.findById(id)
        .populate({
            path: "product",
            populate: {
                path: "category",
            },
        })
        .populate({
            path: "deal",
            populate: {
                path: "product",
            },
        })
        .populate({
            path: "alternatives",
            populate: {
                path: "category",
            },
        });
}


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createReview,
    getReviews,
    getReviewBySlug,
    getAllReviewsAdmin,
    getReviewByIdAdmin,
    updateReview,
    toggleReviewPublish,
    deleteReview,
};