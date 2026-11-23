const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");

// Sellers only see numbers for THEIR items. Admin sees everything.
const sellerId = (req) => (req.user.role === "seller" ? new mongoose.Types.ObjectId(req.user.id) : null);

// Common start of the pipelines: ignore cancelled orders, split each order into one document per item
const itemsStages = (req) => {
  const stages = [{ $match: { status: { $ne: "Cancelled" } } }, { $unwind: "$items" }];
  const s = sellerId(req);
  if (s) stages.push({ $match: { "items.seller": s } });
  return stages;
};

// AGGREGATION PIPELINE 1: total sales + order status counts + monthly revenue
exports.sales = asyncHandler(async (req, res) => {
  const s = sellerId(req);
  const [summary] = await Order.aggregate([
    ...itemsStages(req),
    { $group: { _id: null, totalRevenue: { $sum: "$items.lineTotal" }, unitsSold: { $sum: "$items.quantity" }, orders: { $addToSet: "$_id" } } },
    { $project: { _id: 0, totalRevenue: 1, unitsSold: 1, totalOrders: { $size: "$orders" } } },
  ]);
  const statusCounts = await Order.aggregate([
    ...(s ? [{ $match: { "items.seller": s } }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);
  const monthlyRevenue = await Order.aggregate([
    ...itemsStages(req),
    { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$items.lineTotal" }, orders: { $addToSet: "$_id" } } },
    { $project: { _id: 0, year: "$_id.year", month: "$_id.month", revenue: 1, orders: { $size: "$orders" } } },
    { $sort: { year: 1, month: 1 } },
  ]);
  const get = (st) => (statusCounts.find((x) => x.status === st) || {}).count || 0;
  ok(res, {
    summary: summary || { totalRevenue: 0, unitsSold: 0, totalOrders: 0 },
    statusCounts,
    pendingOrders: get("Pending"),
    completedOrders: get("Delivered"),
    monthlyRevenue,
  });
});

// AGGREGATION PIPELINE 2: best-selling products
exports.bestSelling = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    ...itemsStages(req),
    { $group: { _id: "$items.product", name: { $first: "$items.name" }, unitsSold: { $sum: "$items.quantity" }, revenue: { $sum: "$items.lineTotal" } } },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, productId: "$_id", name: 1, unitsSold: 1, revenue: 1 } },
  ]);
  ok(res, data);
});

// AGGREGATION PIPELINE 3: category-wise sales (uses $lookup to join products and categories)
exports.categorySales = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    ...itemsStages(req),
    { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "prod" } },
    { $unwind: "$prod" },
    { $lookup: { from: "categories", localField: "prod.category", foreignField: "_id", as: "cat" } },
    { $unwind: "$cat" },
    { $group: { _id: "$cat.name", revenue: { $sum: "$items.lineTotal" }, unitsSold: { $sum: "$items.quantity" } } },
    { $project: { _id: 0, category: "$_id", revenue: 1, unitsSold: 1 } },
    { $sort: { revenue: -1 } },
  ]);
  ok(res, data);
});

// AGGREGATION PIPELINE 4: inventory summary and low-stock report
exports.inventory = asyncHandler(async (req, res) => {
  const s = sellerId(req);
  const match = { isActive: true, ...(s ? { seller: s } : {}) };
  const [summary] = await Product.aggregate([
    { $match: match },
    { $group: {
        _id: null,
        totalProducts: { $sum: 1},
        totalUnits: { $sum: "$stock" },
        inventoryValue: { $sum: { $multiply: ["$stock", "$price"] } },
        lowStockCount: { $sum: { $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
    } },
    { $project: { _id: 0 } },
  ]);
  const lowStock = await Product.aggregate([
    { $match: { ...match, $expr: { $lte: ["$stock", "$lowStockThreshold"] } } },
    { $project: { name: 1, stock: 1, lowStockThreshold: 1 } },
    { $sort: { stock: 1 } },
  ]);
  ok(res, { summary: summary || { totalProducts: 0, totalUnits: 0, inventoryValue: 0, lowStockCount: 0, outOfStock: 0 }, lowStock });
});
