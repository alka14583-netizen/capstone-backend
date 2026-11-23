const router = require("express").Router();
const c = require("../controllers/reportController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.use(authenticate, authorize("seller", "admin"));
router.get("/sales", c.sales);
router.get("/best-selling", c.bestSelling);
router.get("/category-sales", c.categorySales);
router.get("/inventory", c.inventory);

module.exports = router;
