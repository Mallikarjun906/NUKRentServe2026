const router = require("express").Router();
const controller = require("../controllers/jobController");
const applications = require("../controllers/applicationController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { uploadListingImages } = require("../middleware/uploadMiddleware");

router.get("/", controller.listJobs);
router.get("/:id", controller.getJob);
router.post("/", authenticate, allowRoles("provider"), uploadListingImages, controller.createJob);
router.post("/:id/applications", authenticate, allowRoles("customer"), applications.applyToJob);
router.get("/:id/applications", authenticate, allowRoles("provider", "admin"), applications.applicationsForJob);
router.patch("/:id", authenticate, allowRoles("provider", "admin"), uploadListingImages, controller.updateJob);
router.delete("/:id", authenticate, allowRoles("provider", "admin"), controller.deleteJob);
router.delete("/:id/images/:imageId", authenticate, allowRoles("provider", "admin"), controller.deleteJobImage);
module.exports = router;
