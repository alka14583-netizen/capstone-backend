const { validationResult } = require("express-validator");

// Runs after the express-validator rules and returns 400 with a clear list of problems
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};
