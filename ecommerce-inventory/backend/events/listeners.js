const events = require("./appEvents");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Listens to internal events, saves a Notification in MongoDB, then pushes it with Socket.IO.
module.exports = function registerListeners(io) {
  const notify = async (userId, type, message, data = {}) => {
    const n = await Notification.create({ user: userId, type, message, data });
    io.to(`user:${userId}`).emit("notification", n); // private room of that user only
  };

  events.on("order:placed", async (order) => {
    try {
      const sellers = [...new Set(order.items.map((i) => i.seller.toString()))];
      for (const s of sellers) await notify(s, "new_order", `New order ${order.orderNumber} received`, { orderId: order.id });
    } catch (e) { console.error("order:placed listener failed", e.message); }
  });

  events.on("order:status", async (order) => {
    try {
      await notify(order.customer, "order_status", `Your order ${order.orderNumber} is now ${order.status}`, { orderId: order.id });
    } catch (e) { console.error("order:status listener failed", e.message); }
  });

  events.on("stock:low", async (product) => {
    try {
      const msg = `Low stock: "${product.name}" has only ${product.stock} left`;
      await notify(product.seller, "low_stock", msg, { productId: product.id });
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      for (const a of admins) await notify(a.id, "low_stock", msg, { productId: product.id });
    } catch (e) { console.error("stock:low listener failed", e.message); }
  });
};
