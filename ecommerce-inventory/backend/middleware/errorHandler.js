const ApiError = require("../utils/ApiError");

exports.notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Central error handler: every error in the app ends up here and becomes a consistent JSON response
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";
  let errors;

  if (err.name === "CastError") { status = 400; message = `Invalid ${err.path}`; }
  else if (err.code === 11000) { status = 409; message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(", ")}`; }
  else if (err.name === "ValidationError") {
    status = 400; message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") { status = 401; message = "Invalid or expired token"; }
  else if (err.type === "entity.parse.failed") { status = 400; message = "Invalid JSON body"; }

  // Never leak internal details for unexpected errors
  if (status === 500) {
    console.error(err);
    message = "Internal server error";
  }
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};
