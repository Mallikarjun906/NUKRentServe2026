const router = require("express").Router();
const controller = require("../controllers/bookingController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post("/", authenticate, allowRoles("customer", "owner"), controller.create);
router.get("/mine", authenticate, allowRoles("customer", "owner"), controller.mine);
router.get("/received", authenticate, allowRoles("customer", "owner", "provider", "admin"), controller.received);
router.patch("/:id/status", authenticate, allowRoles("customer", "owner", "provider", "admin"), controller.updateStatus);
module.exports = router;
