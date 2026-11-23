const router = require("express").Router();
const { body, param, query } = require("express-validator");
const c = require("../controllers/productController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const id = param("id").isMongoId().withMessage("Invalid product id");

// opt = true for PATCH (every field optional)
const rules = (opt) => {
  const w = (chain) => (opt ? chain.optional() : chain);
  return [
    w(body("name")).trim().notEmpty().withMessage("Product name is required"),
    w(body("price")).isFloat({ min: 0 }).withMessage("Price must be a number >= 0"),
    w(body("category")).isMongoId().withMessage("Valid category id is required"),
    body("stock").if(() => !opt).isInt({ min: 0 }).withMessage("Stock must be a whole number >= 0"),
    body("lowStockThreshold").optional().isInt({ min: 0 }).withMessage("Threshold must be a whole number >= 0"),
    body("images").optional().isArray().withMessage("images must be an array of URLs"),
  ];
};

router.get("/", [
  query("category").optional().isMongoId().withMessage("Invalid category id"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be a number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be a number"),
], validate, c.list);
router.get("/seller/mine", authenticate, authorize("seller", "admin"), c.mine); // before "/:id"
router.get("/:id", [id], validate, c.getOne);
router.post("/", authenticate, authorize("seller", "admin"), rules(false), validate, c.create);
router.patch("/:id", authenticate, authorize("seller", "admin"), [id, ...rules(true)], validate, c.update);
router.delete("/:id", authenticate, authorize("seller", "admin"), [id], validate, c.remove);

module.exports = router;
