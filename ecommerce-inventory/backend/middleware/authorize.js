const ApiError = require("../utils/ApiError");

// Role-Based Access Control. Usage: authorize("seller", "admin")
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};
