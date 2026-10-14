const { canonicalSlug } = require("../utils/categories");
const { parseOfferDate, validateOfferDates, unexpiredDealFilter } = require("../utils/dealDates");
const Deal = require("../models/Deal");
const Product = require("../models/Product");
const publicProductSelect = require("../utils/publicProductSelect");

const createDeal = async (req, res) => {
    try {
        const {
            product,
            discount,
            price,
            oldPrice,
            dealUrl,
            dealType,
            startDate,
            endDate,
            isActive,
        } = req.body;

        if (isActive !== undefined && typeof isActive !== "boolean") {
            return res.status(400).json({ message: "Publish status must be a boolean" });
        }

        const productExists = await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const deal = await Deal.create({
            product,
            discount,
            price,
            oldPrice,
            dealUrl,
            dealType,
            isActive,
            startDate: parseOfferDate(startDate, "Start date"),
            endDate: parseOfferDate(endDate, "End date"),
        });

        const populatedDeal = await Deal.findById(deal._id).populate({
            path: "product",
            populate: {
                path: "category",
            },
        });

        res.status(201).json(populatedDeal);
    } catch (error) {
        res.status(400).json({
            message: "Could not create deal",
            error: error.message,
        });
    }
};

const getDeals = async (req, res) => {
    try {
        const deals = await Deal.find(unexpiredDealFilter())
            .populate({
                path: "product",
                select: publicProductSelect,

                populate: {
                    path: "category",
                },
            })
            .sort({
                createdAt: -1,
            });

        return res.status(200).json(deals);

    } catch (error) {
        console.error(
            "Get deals error:",
            error
        );

        return res.status(500).json({
            message: "Could not fetch deals",
        });
    }
};

const getDealById = async (req, res) => {
    try {
        const deal = await Deal.findOne({
            _id: req.params.id,
            isActive: true,
        }).populate({
            path: "product",

            select: publicProductSelect,

            populate: {
                path: "category",
            },
        });

        if (!deal) {
            return res.status(404).json({
                message: "Deal not found",
            });
        }

        return res.status(200).json(deal);

    } catch (error) {
        console.error(
            "Get deal error:",
            error
        );

        return res.status(400).json({
            message: "Could not fetch deal",
        });
    }
};

const getDealsByCategory = async (
    req,
    res
) => {
    try {
        const categorySlug =
            canonicalSlug(req.params.slug);

        const deals = await Deal.find(unexpiredDealFilter())
            .populate({
                path: "product",

                select: publicProductSelect,

                populate: {
                    path: "category",
                },
            })
            .sort({
                createdAt: -1,
            });

        const filteredDeals =
            deals.filter(
                (deal) =>
                    deal.product &&
                    deal.product.category &&
                    canonicalSlug(deal.product.category.slug) ===
                    categorySlug
            );

        return res
            .status(200)
            .json(filteredDeals);

    } catch (error) {
        console.error(
            "Get category deals error:",
            error
        );

        return res.status(500).json({
            message:
                "Could not fetch category deals",
        });
    }
};

// ==============================
// UPDATE DEAL
// ==============================

const updateDeal = async (req, res) => {
    try {
        const {
            discount,
            price,
            oldPrice,
            dealUrl,
            dealType,
        } = req.body;

        const deal = await Deal.findById(req.params.id);

        if (!deal) {
            return res.status(404).json({
                message: "Deal not found",
            });
        }

        if (req.body.lastKnownUpdatedAt && deal.updatedAt) {
            const clientDate = new Date(req.body.lastKnownUpdatedAt).getTime();
            const serverDate = new Date(deal.updatedAt).getTime();
            if (Math.abs(serverDate - clientDate) > 1000) {
                return res.status(409).json({
                    message: "Conflict detected: this deal was modified by another user while you were editing. Please refresh to view latest changes.",
                    conflict: true,
                    serverUpdatedAt: deal.updatedAt,
                });
            }
        }

        if (discount !== undefined) {
            deal.discount = discount;
        }

        if (price !== undefined) {
            deal.price = Number(price);
        }

        if (oldPrice !== undefined) {
            deal.oldPrice = Number(oldPrice);
        }

        if (dealUrl !== undefined) {
            deal.dealUrl = dealUrl;
        }

        if (dealType !== undefined) {
            deal.dealType = dealType;
        }

        if (req.body.startDate !== undefined) deal.startDate = parseOfferDate(req.body.startDate, "Start date");
        if (req.body.endDate !== undefined) deal.endDate = parseOfferDate(req.body.endDate, "End date");
        if (req.body.startDate !== undefined || req.body.endDate !== undefined) validateOfferDates(deal.startDate, deal.endDate);

        await deal.save();

        const updatedDeal = await Deal.findById(
            deal._id
        ).populate({
            path: "product",
            populate: {
                path: "category",
            },
        });

        res.status(200).json({
            message: "Deal updated successfully",
            deal: updatedDeal,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not update deal",
            error: error.message,
        });
    }
};


// ==============================
// ACTIVATE / DEACTIVATE DEAL
// ==============================

const toggleDealStatus = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);

        if (!deal) {
            return res.status(404).json({
                message: "Deal not found",
            });
        }

        deal.isActive = !deal.isActive;

        await deal.save();

        const updatedDeal = await Deal.findById(
            deal._id
        ).populate({
            path: "product",
            populate: {
                path: "category",
            },
        });

        res.status(200).json({
            message: deal.isActive
                ? "Deal activated successfully"
                : "Deal deactivated successfully",

            deal: updatedDeal,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not change deal status",
            error: error.message,
        });
    }
};


// ==============================
// DELETE DEAL
// ==============================

const deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);

        if (!deal) {
            return res.status(404).json({
                message: "Deal not found",
            });
        }

        await deal.deleteOne();

        res.status(200).json({
            message: "Deal deleted successfully",
            id: req.params.id,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not delete deal",
            error: error.message,
        });
    }
};

// ==============================
// GET ALL DEALS FOR ADMIN
// ==============================

const getAllDealsAdmin = async (req, res) => {
    try {
        const deals = await Deal.find()
            .populate({
                path: "product",
                populate: {
                    path: "category",
                },
            })
            .sort({ createdAt: -1 });

        res.status(200).json(deals);
    } catch (error) {
        res.status(500).json({
            message: "Could not fetch admin deals",
            error: error.message,
        });
    }
};

// ==============================
// GET SINGLE DEAL FOR ADMIN
// ==============================

const getDealByIdAdmin = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id).populate({
            path: "product",
            populate: {
                path: "category",
            },
        });

        if (!deal) {
            return res.status(404).json({
                message: "Deal not found",
            });
        }

        res.status(200).json(deal);
    } catch (error) {
        res.status(400).json({
            message: "Could not fetch deal",
            error: error.message,
        });
    }
};

module.exports = {
    createDeal,
    getDeals,
    getDealById,
    getDealsByCategory,
    getAllDealsAdmin,
    getDealByIdAdmin,
    updateDeal,
    toggleDealStatus,
    deleteDeal,
};
