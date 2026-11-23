const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const events = require("../events/appEvents");

// ATOMIC stock reduction. The filter { stock: { $gte: qty } } and the $inc happen in ONE
// database operation, so two customers can never both buy the last item (no overselling,
// stock can never go negative). Returns the updated product, or null if stock was not enough.
exports.reduceStock = async (productId, qty, { orderId, userId } = {}) => {
  const updated = await Product.findOneAndUpdate(
    { _id: productId, isActive: true, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  );
  if (!updated) return null;
  await Inventory.create({
    product: updated._id, seller: updated.seller, type: "sale", quantityChange: -qty,
    stockBefore: updated.stock + qty, stockAfter: updated.stock, order: orderId, performedBy: userId,
    note: "Stock reduced for order",
  });
  if (updated.stock <= updated.lowStockThreshold) events.emit("stock:low", updated);
  return updated;
};

exports.restoreStock = async (productId, qty, { orderId, userId, type = "cancel_restore", note = "Stock restored after order cancellation" } = {}) => {
  const updated = await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } }, { new: true });
  if (!updated) return null;
  await Inventory.create({
    product: updated._id, seller: updated.seller, type, quantityChange: qty,
    stockBefore: updated.stock - qty, stockAfter: updated.stock, order: orderId, performedBy: userId, note,
  });
  return updated;
};

// Manual stock correction by seller/admin (sets an exact number)
exports.setStock = async (productId, newStock, { userId, type = "adjustment", note = "Manual stock update" } = {}) => {
  const before = await Product.findOneAndUpdate({ _id: productId }, { $set: { stock: newStock } }, { new: false });
  if (!before) return null;
  await Inventory.create({
    product: before._id, seller: before.seller, type, quantityChange: newStock - before.stock,
    stockBefore: before.stock, stockAfter: newStock, performedBy: userId, note,
  });
  if (newStock <= before.lowStockThreshold) {
    events.emit("stock:low", { id: before.id, name: before.name, seller: before.seller, stock: newStock });
  }
  return { ...before.toObject(), stock: newStock };
};
