const mongoose = require("mongoose");

const STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshot of each product at purchase time, so later price changes do not alter old orders
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        lineTotal: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    status: { type: String, enum: STATUSES, default: "Pending" },
    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
    // Payment is SIMULATED. No real payment details are ever collected.
    paymentMethod: { type: String, default: "simulated" },
    paymentStatus: { type: String, enum: ["simulated_paid", "simulated_refunded"], default: "simulated_paid" },
  },
  { timestamps: true }
);

// INDEX 3: "my orders, newest first" for a customer
orderSchema.index({ customer: 1, createdAt: -1 });
// INDEX 4: seller order lists and seller-wise reports
orderSchema.index({ "items.seller": 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
module.exports.STATUSES = STATUSES;
