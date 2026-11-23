const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stock: { type: Number, required: true, min: [0, "Stock cannot be negative"], default: 0, validate: Number.isInteger },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true }, // false = deleted (soft delete keeps old orders valid)
  },
  { timestamps: true }
);

// INDEX 1: speeds up "filter by category and sort/filter by price" on the product list page
productSchema.index({ category: 1, price: 1 });
// INDEX 2: speeds up "show this seller's products, newest first" (seller dashboard)
productSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
