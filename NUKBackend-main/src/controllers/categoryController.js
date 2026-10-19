const ServiceCategory = require("../models/ServiceCategory");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });
  res.json(new ApiResponse(200, categories));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description = "" } = req.body;
  if (!name || !slug) throw new ApiError(400, "name and slug are required.");
  const category = await ServiceCategory.create({ name, slug: slug.toLowerCase().trim(), description });
  res.status(201).json(new ApiResponse(201, category, "Category created."));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, strict: "throw" });
  if (!category) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, category, "Category updated."));
});

module.exports = { listCategories, createCategory, updateCategory };
