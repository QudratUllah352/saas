const Product = require("../models/Product");
const AffiliateClick = require("../models/AffiliateClick");

const isValidAffiliateUrl = (value) => {
    if (!value || typeof value !== "string") {
        return false;
    }

    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch {
        return false;
    }
};

/* =====================================================
   REDIRECT TO AFFILIATE WEBSITE
===================================================== */

const redirectToAffiliate = async (req, res) => {
    try {
        const { productId } = req.params;
        const { source = "other" } = req.query;

        const allowedSources = [
            "deal",
            "review",
            "comparison",
            "blog",
            "homepage",
            "search",
            "other",
        ];

        const safeSource = allowedSources.includes(source)
            ? source
            : "other";

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        if (
            !product.affiliate?.enabled ||
            !product.affiliate?.url
        ) {
            return res.status(404).json({
                message:
                    "Affiliate link is not available for this product",
            });
        }

        if (
            !isValidAffiliateUrl(
                product.affiliate.url
            )
        ) {
            console.error(
                "Invalid affiliate URL for product:",
                product._id
            );

            return res.status(500).json({
                message:
                    "Affiliate destination is unavailable.",
            });
        }

        /* Save click */

        try {
            await AffiliateClick.create({
                product: product._id,
                source: safeSource,
                userAgent: req.get("user-agent") || "",
                referrer: req.get("referer") || "",
            });
        } catch (trackingError) {
            console.error(
                "Affiliate tracking error:",
                trackingError.message
            );

            // Do not stop the visitor just because
            // analytics failed.
        }

        /* Redirect visitor */

        return res.redirect(product.affiliate.url);
    } catch (error) {
        console.error(
            "Affiliate redirect error:",
            error.message
        );

        return res.status(500).json({
            message: "Affiliate redirect failed",
        });
    }
};


/* =====================================================
   ADMIN AFFILIATE STATISTICS
===================================================== */

const getAffiliateStats = async (req, res) => {
    try {
        const totalClicks =
            await AffiliateClick.countDocuments();

        const clicksByProduct =
            await AffiliateClick.aggregate([
                {
                    $group: {
                        _id: "$product",
                        clicks: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        clicks: -1,
                    },
                },

                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },

                {
                    $unwind: "$product",
                },

                {
                    $project: {
                        _id: 0,

                        productId: "$product._id",

                        productName:
                            "$product.name",

                        clicks: 1,
                    },
                },
            ]);

        const clicksBySource =
            await AffiliateClick.aggregate([
                {
                    $group: {
                        _id: "$source",

                        clicks: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        clicks: -1,
                    },
                },
            ]);

        return res.json({
            totalClicks,
            clicksByProduct,
            clicksBySource,
        });
    } catch (error) {
        console.error(
            "Affiliate statistics error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Could not load affiliate statistics",
        });
    }
};

/* =====================================================
   GET PRODUCTS WITH AFFILIATE INFORMATION - ADMIN
===================================================== */

const getAffiliateProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .select(
                "name slug logo website affiliate"
            )
            .sort({ name: 1 });

        return res.json(products);
    } catch (error) {
        console.error(
            "Get affiliate products error:",
            error.message
        );

        return res.status(500).json({
            message: "Could not load affiliate products",
        });
    }
};


/* =====================================================
   UPDATE PRODUCT AFFILIATE SETTINGS - ADMIN
===================================================== */

const updateAffiliateSettings = async (req, res) => {
    try {
        const { productId } = req.params;

        const {
            enabled,
            url,
            programName,
            network,
            commissionType,
            commissionValue,
            disclosureText,
        } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const allowedCommissionTypes = [
            "percentage",
            "fixed",
            "recurring",
            "unknown",
        ];

        if (
            commissionType &&
            !allowedCommissionTypes.includes(commissionType)
        ) {
            return res.status(400).json({
                message: "Invalid commission type",
            });
        }

        if (url != null && typeof url !== "string") {
            return res.status(400).json({
                message:
                    "Please enter a valid HTTP or HTTPS affiliate URL.",
            });
        }

        const normalizedUrl = url?.trim() || "";

        if (enabled && !normalizedUrl) {
            return res.status(400).json({
                message:
                    "An affiliate URL is required when affiliate marketing is enabled.",
            });
        }

        if (normalizedUrl && !isValidAffiliateUrl(normalizedUrl)) {
            return res.status(400).json({
                message:
                    "Please enter a valid HTTP or HTTPS affiliate URL.",
            });
        }

        product.affiliate = {
            enabled: Boolean(enabled),

            url: normalizedUrl,

            programName: programName?.trim() || "",

            network: network?.trim() || "",

            commissionType:
                commissionType || "unknown",

            commissionValue:
                commissionValue?.trim() || "",

            disclosureText:
                disclosureText?.trim() || "",
        };

        await product.save();

        return res.json({
            message: "Affiliate settings updated successfully",
            product,
        });
    } catch (error) {
        console.error(
            "Update affiliate settings error:",
            error.message
        );

        return res.status(500).json({
            message: "Could not update affiliate settings",
        });
    }
};

module.exports = {
    redirectToAffiliate,
    getAffiliateStats,
    getAffiliateProducts,
    updateAffiliateSettings,
};