const router = require("express").Router();
const { body } = require("express-validator");
const c = require("../controllers/authController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required").bail().trim().toLowerCase(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["customer", "seller"]).withMessage("Role must be customer or seller"),
], validate, c.register);

router.post("/login", authLimiter, [
  body("email").isEmail().withMessage("Valid email is required").bail().trim().toLowerCase(),
  body("password").notEmpty().withMessage("Password is required"),
], validate, c.login);

router.post("/refresh", authLimiter, [body("refreshToken").notEmpty().withMessage("refreshToken is required")], validate, c.refresh);
router.post("/logout", [body("refreshToken").notEmpty().withMessage("refreshToken is required")], validate, c.logout);
router.get("/me", authenticate, c.me);

module.exports = router;
