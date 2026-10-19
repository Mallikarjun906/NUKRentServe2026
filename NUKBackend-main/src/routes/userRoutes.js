const router = require("express").Router();
const controller = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/me", authenticate, controller.getMe);
router.patch("/me", authenticate, controller.updateMe);

module.exports = router;
