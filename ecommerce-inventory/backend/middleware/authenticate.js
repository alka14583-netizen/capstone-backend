const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Checks the "Authorization: Bearer <token>" header and attaches the user to req.user
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new ApiError(401, "Authentication required");
  let payload;
  try {
    payload = jwt.verify(header.split(" ")[1], process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, "User no longer exists or is disabled");
  req.user = user;
  next();
});
