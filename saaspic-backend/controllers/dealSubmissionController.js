const { parseOfferDate, validateOfferDates } = require("../utils/dealDates");
const { resolveCategory } = require("../utils/categories");
const DealSubmission = require("../models/DealSubmission");
const Product = require("../models/Product");
const Deal = require("../models/Deal");
const Category = require("../models/Category");

const createDealSubmission = async (req, res) => {
    try {
        const {
            productName,
            website,
            email,
            category,
            deal,
            description,
        } = req.body;

        if (
            !productName ||
            !website ||
            !email ||
            !category ||
            !deal ||
            !description
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields",
            });
        }

        const definition = resolveCategory(category);
        if (!definition) return res.status(400).json({ message: 'Select one of the six main categories.' });
        const submission = await DealSubmission.create({
            productName,
            website,
            email,
            category: definition.name,
            deal,
            description,
        });

        res.status(201).json({
            message: "Deal submitted successfully",
            submission,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not submit deal",
        });
    }
};

const getDealSubmissions = async (req, res) => {
    try {
        const submissions = await DealSubmission.find()
            .sort({ createdAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({
            message: "Could not fetch deal submissions",
            error: error.message,
        });
    }
};

// APPROVE SUBMISSION
const approveDealSubmission = async (req, res) => {
    try {
        const submission = await DealSubmission.findById(
            req.params.id
        );

        if (!submission) {
            return res.status(404).json({
                message: "Deal submission not found",
            });
        }

        if (submission.status === "approved") {
            return res.status(400).json({
                message: "Deal submission is already approved",
            });
        }

        submission.status = "approved";

        await submission.save();

        res.status(200).json({
            message: "Deal submission approved",
            submission,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not approve deal submission",
            error: error.message,
        });
    }
};


// REJECT SUBMISSION
const rejectDealSubmission = async (req, res) => {
    try {
        const submission = await DealSubmission.findById(
            req.params.id
        );

        if (!submission) {
            return res.status(404).json({
                message: "Deal submission not found",
            });
        }

        submission.status = "rejected";

        await submission.save();

        res.status(200).json({
            message: "Deal submission rejected",
            submission,
        });
    } catch (error) {
        res.status(400).json({
            message: "Could not reject deal submission",
            error: error.message,
        });
    }
};

const publishDealSubmission = async (req, res) => {
    try {
        const {
            price,
            oldPrice,
            discount,
            dealUrl,
            dealType,
        } = req.body;

        const startDate = parseOfferDate(req.body.startDate, "Start date");
        const endDate = parseOfferDate(req.body.endDate, "End date");
        validateOfferDates(startDate, endDate);

        // Check required publishing fields
        if (
            price === undefined ||
            oldPrice === undefined ||
            !discount ||
            !dealUrl
        ) {
            return res.status(400).json({
                message: "Please provide all publishing information",
            });
        }

        // Find the submitted deal
        const submission = await DealSubmission.findById(
            req.params.id
        );

        if (!submission) {
            return res.status(404).json({
                message: "Deal submission not found",
            });
        }

        // Prevent publishing twice
        if (submission.status === "approved") {
            return res.status(400).json({
                message: "This submission is already approved",
            });
        }

        // Prevent rejected submissions from being published
        if (submission.status === "rejected") {
            return res.status(400).json({
                message: "Rejected submissions cannot be published",
            });
        }

        // Find the category selected by the user
        const category = await Category.findOne({
            name: {
                $regex: `^${resolveCategory(submission.category)?.name || submission.category}$`,
                $options: "i",
            },
        });

        if (!category) {
            return res.status(404).json({
                message: `Category "${submission.category}" was not found`,
            });
        }

        // Generate product slug
        const slug = submission.productName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Check if product already exists
        let product = await Product.findOne({
            slug: slug,
        });

        // Create product if it does not exist
        if (!product) {
            product = await Product.create({
                name: submission.productName,
                slug: slug,
                description: submission.description,
                website: submission.website,
                category: category._id,
            });
        }

        // Create the actual published deal
        const deal = await Deal.create({
            product: product._id,
            discount: discount,
            price: Number(price),
            oldPrice: Number(oldPrice),
            dealUrl: dealUrl,
            dealType: dealType || "other",
            isActive: true,
            startDate,
            endDate,
        });

        // Change submission status
        submission.status = "approved";

        await submission.save();

        // Get complete deal with product and category
        const publishedDeal = await Deal.findById(
            deal._id
        ).populate({
            path: "product",
            populate: {
                path: "category",
            },
        });

        res.status(201).json({
            message: "Deal published successfully",
            submission: submission,
            deal: publishedDeal,
        });

    } catch (error) {
        console.error("Publish deal error:", error);

        res.status(400).json({
            message: "Could not publish deal",
            error: error.message,
        });
    }
};

module.exports = {
    createDealSubmission,
    getDealSubmissions,
    approveDealSubmission,
    rejectDealSubmission,
    publishDealSubmission,
};
