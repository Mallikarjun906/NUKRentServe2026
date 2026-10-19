const router = require("express").Router();
const controller = require("../controllers/adminController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.use(authenticate, allowRoles("admin"));
router.get("/stats", controller.dashboardStats);
router.get("/provider-applications", controller.listProviderApplications);
router.get("/provider-applications/:id/document", controller.viewApplicationDocument);
router.patch("/provider-applications/:id/identity-review", controller.reviewIdentity);
router.patch("/provider-applications/:id", controller.decideProviderApplication);
router.get("/users", controller.listUsers);
router.patch("/users/:id/status", controller.setUserStatus);

module.exports = router;
