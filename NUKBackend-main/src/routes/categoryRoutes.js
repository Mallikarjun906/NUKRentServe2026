const router = require("express").Router();
const controller = require("../controllers/categoryController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get("/", controller.listCategories);
router.post("/", authenticate, allowRoles("admin"), controller.createCategory);
router.patch("/:id", authenticate, allowRoles("admin"), controller.updateCategory);

module.exports = router;
