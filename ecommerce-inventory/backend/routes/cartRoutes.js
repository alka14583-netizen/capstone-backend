const router = require("express").Router();
const { body, param } = require("express-validator");
const c = require("../controllers/cartController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const pid = param("productId").isMongoId().withMessage("Invalid product id");
const qty = body("quantity").isInt({ min: 1, max: 99 }).withMessage("Quantity must be between 1 and 99");

// Only customers have a cart. Each cart is found by req.user.id, so carts are private.
router.use(authenticate, authorize("customer"));
router.get("/", c.get);
router.post("/", [body("productId").isMongoId().withMessage("Valid productId is required"), qty], validate, c.add);
router.patch("/:productId", [pid, qty], validate, c.update);
router.delete("/:productId", [pid], validate, c.remove);

module.exports = router;
