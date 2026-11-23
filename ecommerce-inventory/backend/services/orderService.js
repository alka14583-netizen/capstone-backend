const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const inventory = require("./inventoryService");
const events = require("../events/appEvents");

// Allowed status changes. Anything not listed here is rejected with 400.
const TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
exports.TRANSITIONS = TRANSITIONS;

const round = (n) => Math.round(n * 100) / 100;
const makeOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

exports.placeOrder = async (user, shippingAddress) => {
  const cart = await Cart.findOne({ user: user.id });
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Your cart is empty");

  // 1. Read the REAL product data from the database (never trust the frontend)
  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = [];
  for (const item of cart.items) {
    const p = byId.get(item.product.toString());
    if (!p || !p.isActive) throw new ApiError(409, "A product in your cart is no longer available");
    if (p.stock < item.quantity) throw new ApiError(409, `Insufficient stock for "${p.name}". Available: ${p.stock}`);
    lines.push({ product: p._id, seller: p.seller, name: p.name, price: p.price, quantity: item.quantity, lineTotal: round(p.price * item.quantity) });
  }

  // 2. Reduce stock atomically for each item. If any item fails (someone bought it
  //    at the same moment), put back what we already reduced and stop.
  const orderId = new mongoose.Types.ObjectId();
  const reduced = [];
  let order;
  try {
    for (const l of lines) {
      const ok = await inventory.reduceStock(l.product, l.quantity, { orderId, userId: user.id });
      if (!ok) throw new ApiError(409, `Insufficient stock for "${l.name}". Please update your cart`);
      reduced.push(l);
    }
    order = await Order.create({
      _id: orderId,
      orderNumber: makeOrderNumber(),
      customer: user.id,
      items: lines,
      totalAmount: round(lines.reduce((sum, l) => sum + l.lineTotal, 0)),
      shippingAddress,
      statusHistory: [{ status: "Pending", changedBy: user.id }],
    });
  } catch (err) {
    for (const l of reduced) {
      await inventory.restoreStock(l.product, l.quantity, { orderId, userId: user.id, type: "rollback", note: "Order failed - stock restored" });
    }
    throw err;
  }

  cart.items = [];
  await cart.save();
  events.emit("order:placed", order);
  return order;
};

exports.changeStatus = async (order, newStatus, user) => {
  if (!TRANSITIONS[order.status].includes(newStatus)) {
    throw new ApiError(400, `Cannot change status from ${order.status} to ${newStatus}`);
  }
  if (newStatus === "Cancelled") {
    // Give the stock back for every item in the order
    for (const item of order.items) {
      await inventory.restoreStock(item.product, item.quantity, { orderId: order._id, userId: user.id });
    }
    order.paymentStatus = "simulated_refunded";
  }
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedBy: user.id });
  await order.save();
  events.emit("order:status", order);
  return order;
};

// Who may see/change this order?
exports.canAccess = (order, user) => {
  if (user.role === "admin") return true;
  if (user.role === "customer") return order.customer._id
    ? order.customer._id.toString() === user.id
    : order.customer.toString() === user.id;
  return order.items.some((i) => i.seller.toString() === user.id);
};
