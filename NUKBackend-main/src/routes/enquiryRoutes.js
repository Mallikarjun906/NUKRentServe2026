const router = require("express").Router();
const controller = require("../controllers/enquiryController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post("/", authenticate, allowRoles("customer"), controller.createEnquiry);
router.get("/my", authenticate, controller.myEnquiries);
router.get("/received", authenticate, allowRoles("provider", "admin"), controller.enquiriesForMyListings);
router.patch("/:id/status", authenticate, allowRoles("provider", "admin"), controller.updateEnquiryStatus);

module.exports = router;
