const router = require("express").Router();
const { param } = require("express-validator");
const c = require("../controllers/notificationController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");

router.use(authenticate);
router.get("/", c.list);
router.patch("/read-all", c.markAllRead);
router.patch("/:id/read", [param("id").isMongoId().withMessage("Invalid id")], validate, c.markRead);

module.exports = router;
