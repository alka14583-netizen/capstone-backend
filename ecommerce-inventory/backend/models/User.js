const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    // select:false -> the password hash is never returned unless we ask for it explicitly
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash the password with bcrypt before saving (only when it was changed)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
