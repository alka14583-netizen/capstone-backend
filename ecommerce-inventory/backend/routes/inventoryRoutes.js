const router = require("express").Router();
const { body, param } = require("express-validator");
const c = require("../controllers/inventoryController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const pid = param("productId").isMongoId().withMessage("Invalid product id");

router.use(authenticate, authorize("seller", "admin"));
router.get("/", c.list);
router.get("/low-stock", c.lowStock); // before "/:productId"
router.get("/history/:productId", [pid], validate, c.history);
router.patch("/:productId", [pid, body("stock").isInt({ min: 0 }).withMessage("Stock must be a whole number >= 0")], validate, c.update);

module.exports = router;
