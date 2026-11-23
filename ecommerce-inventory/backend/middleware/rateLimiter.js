const rateLimit = require("express-rate-limit");

// Limits repeated login/register attempts from one IP (protects against password guessing)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});
