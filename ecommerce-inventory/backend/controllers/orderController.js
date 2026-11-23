const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const orderService = require("../services/orderService");
const { ok } = require("../utils/apiResponse");

const loadOrder = async (req) => {
  const order = await Order.findById(req.params.id).populate("customer", "name email");
  if (!order) throw new ApiError(404, "Order not found");
  // Customers see only their own orders; sellers only orders containing their products
  if (!orderService.canAccess(order, req.user)) throw new ApiError(403, "You are not allowed to access this order");
  return order;
};

exports.create = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user, req.body.shippingAddress);
  ok(res, order, "Order placed successfully", 201);
});

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "customer") filter.customer = req.user.id;
  if (req.user.role === "seller") filter["items.seller"] = req.user.id;
  if (req.query.status) filter.status = req.query.status;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const [items, total] = await Promise.all([
    Order.find(filter).populate("customer", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getOne = asyncHandler(async (req, res) => ok(res, await loadOrder(req)));

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await loadOrder(req); // seller must own an item in this order
  ok(res, await orderService.changeStatus(order, req.body.status, req.user), "Order status updated");
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await loadOrder(req);
  ok(res, await orderService.changeStatus(order, "Cancelled", req.user), "Order cancelled and stock restored");
});
