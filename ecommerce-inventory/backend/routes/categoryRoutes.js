const router = require("express").Router();
const { body, param } = require("express-validator");
const c = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const id = param("id").isMongoId().withMessage("Invalid category id");

router.get("/", c.list);
router.post("/", authenticate, authorize("admin"), [body("name").trim().notEmpty().withMessage("Category name is required")], validate, c.create);
router.patch("/:id", authenticate, authorize("admin"), [id], validate, c.update);
router.delete("/:id", authenticate, authorize("admin"), [id], validate, c.remove);

module.exports = router;
