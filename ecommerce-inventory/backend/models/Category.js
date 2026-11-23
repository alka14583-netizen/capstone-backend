const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Category name is required"], unique: true, trim: true, maxlength: 50 },
    slug: { type: String, unique: true },
    description: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// Create a URL-friendly slug from the name, e.g. "Home & Kitchen" -> "home-kitchen"
categorySchema.pre("validate", function (next) {
  if (this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  next();
});

module.exports = mongoose.model("Category", categorySchema);
