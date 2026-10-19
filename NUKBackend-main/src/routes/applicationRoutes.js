const router = require("express").Router();
const controller = require("../controllers/applicationController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
router.get("/my", authenticate, allowRoles("customer"), controller.myApplications);
router.patch("/:id/status", authenticate, allowRoles("provider", "admin"), controller.updateApplicationStatus);
router.patch("/:id/withdraw", authenticate, allowRoles("customer"), controller.withdrawApplication);
module.exports = router;
