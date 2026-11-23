const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const inventoryService = require("../services/inventoryService");
const { ok } = require("../utils/apiResponse");

const scope = (req) => (req.user.role === "seller" ? { seller: req.user.id } : {}); // admin sees everything

const ownedProduct = async (req) => {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new ApiError(404, "Product not found");
  if (req.user.role === "seller" && product.seller.toString() !== req.user.id) {
    throw new ApiError(403, "You can only manage stock of your own products");
  }
  return product;
};

exports.list = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, ...scope(req) })
    .populate("category", "name").populate("seller", "name").sort({ stock: 1 });
  ok(res, products.map((p) => ({ ...p.toObject(), id: p.id, lowStock: p.stock <= p.lowStockThreshold })));
});

exports.lowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true, ...scope(req), $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  }).populate("seller", "name").sort({ stock: 1 });
  ok(res, products);
});

exports.update = asyncHandler(async (req, res) => {
  await ownedProduct(req);
  const updated = await inventoryService.setStock(req.params.productId, Number(req.body.stock), { userId: req.user.id, note: req.body.note });
  ok(res, { id: req.params.productId, stock: updated.stock }, "Stock updated");
});

exports.history = asyncHandler(async (req, res) => {
  await ownedProduct(req);
  ok(res, await Inventory.find({ product: req.params.productId }).sort({ createdAt: -1 }).limit(50));
});
