const mongoose = require("mongoose");

// Append-only history: every stock change creates one record here.
const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["sale", "cancel_restore", "rollback", "adjustment", "restock"], required: true },
    quantityChange: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  { timestamps: true }
);

// INDEX 5: stock history of one product, newest first
inventorySchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("Inventory", inventorySchema);
