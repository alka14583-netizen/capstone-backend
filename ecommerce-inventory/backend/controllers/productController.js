const Product = require("../models/Product");
const Category = require("../models/Category");
const Inventory = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/apiResponse");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };

// Shared by the public list and the seller's own list
const paginate = async (filter, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 12));
  const [items, total] = await Promise.all([
    Product.find(filter).populate("category", "name").populate("seller", "name")
      .sort(SORTS[query.sort] || SORTS.newest).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

exports.list = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const filter = { isActive: true };
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  ok(res, await paginate(filter, req.query));
});

exports.mine = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.user.role === "seller") filter.seller = req.user.id; // admin sees all
  ok(res, await paginate(filter, { ...req.query, limit: req.query.limit || 50 }));
});

exports.getOne = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate("category", "name").populate("seller", "name");
  if (!product) throw new ApiError(404, "Product not found");
  ok(res, product);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, price, images, category, stock, lowStockThreshold } = req.body;
  if (!(await Category.exists({ _id: category }))) throw new ApiError(400, "Category does not exist");
  // A seller can only create products for themselves. Admin may pass a seller id.
  const seller = req.user.role === "admin" && req.body.seller ? req.body.seller : req.user.id;
  const product = await Product.create({ name, description, price, images, category, stock, lowStockThreshold, seller });
  await Inventory.create({
    product: product._id, seller, type: "restock", quantityChange: product.stock,
    stockBefore: 0, stockAfter: product.stock, performedBy: req.user.id, note: "Initial stock",
  });
  ok(res, product, "Product created", 201);
});

// Seller may touch only their own products (ownership check). Stock is changed via /api/inventory.
const findOwned = async (req) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  if (req.user.role === "seller" && product.seller.toString() !== req.user.id) {
    throw new ApiError(403, "You can only manage your own products");
  }
  return product;
};

exports.update = asyncHandler(async (req, res) => {
  const product = await findOwned(req);
  for (const f of ["name", "description", "price", "images", "category", "lowStockThreshold"]) {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  }
  await product.save();
  ok(res, product, "Product updated");
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await findOwned(req);
  product.isActive = false; // soft delete: old orders keep working
  await product.save();
  ok(res, null, "Product deleted");
});
