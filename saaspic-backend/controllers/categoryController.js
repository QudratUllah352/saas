const Category = require("../models/Category");
const { categories, resolveCategory } = require("../utils/categories");

const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    const definition = resolveCategory(slug);
    if (!definition || definition.name !== name || definition.slug !== slug) {
      return res.status(400).json({ message: 'Choose one of the six main categories with its exact name and slug.' });
    }
    const category = await Category.findOneAndUpdate({ slug }, { $setOnInsert: {
      name,
      slug,
      description,
      isMain: true,
    } }, { upsert: true, new: true, runValidators: true });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({
      message: "Could not create category",
      error: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const records = await Category.find({ slug: { $in: categories.map((item) => item.slug) } });
    const mainCategories = categories.map((item) => records.find((record) => record.slug === item.slug)).filter(Boolean);

    res.status(200).json(mainCategories);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch categories",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
};
