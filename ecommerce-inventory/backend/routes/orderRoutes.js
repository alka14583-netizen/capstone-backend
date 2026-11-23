const router = require("express").Router();
const { body, param } = require("express-validator");
const c = require("../controllers/orderController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { STATUSES } = require("../models/Order");

const id = param("id").isMongoId().withMessage("Invalid order id");
const addr = (f, label) => body(`shippingAddress.${f}`).trim().notEmpty().withMessage(`${label} is required`);

router.use(authenticate);
router.post("/", authorize("customer"), [
  addr("fullName", "Full name"), addr("phone", "Phone"), addr("line1", "Address"),
  addr("city", "City"), addr("state", "State"), addr("postalCode", "Postal code"),
], validate, c.create);
router.get("/", c.list);
router.get("/:id", [id], validate, c.getOne);
router.patch("/:id/status", authorize("seller", "admin"), [id, body("status").isIn(STATUSES).withMessage("Invalid status")], validate, c.updateStatus);
router.post("/:id/cancel", [id], validate, c.cancel);

module.exports = router;
