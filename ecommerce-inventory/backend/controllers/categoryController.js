const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/apiResponse");

exports.list = asyncHandler(async (req, res) => ok(res, await Category.find().sort({ name: 1 })));

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create({ name: req.body.name, description: req.body.description });
  ok(res, category, "Category created", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save(); // save() so the slug is regenerated
  ok(res, category, "Category updated");
});

exports.remove = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id, isActive: true })) {
    throw new ApiError(409, "Cannot delete a category that still has products");
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  ok(res, null, "Category deleted");
});
