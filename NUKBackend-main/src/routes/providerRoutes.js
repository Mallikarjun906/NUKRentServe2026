const router = require("express").Router();
const applicationController = require("../controllers/providerApplicationController");
const { uploadAadhaarDocument } = require("../middleware/identityUploadMiddleware");
router.post("/register", uploadAadhaarDocument, applicationController.submit);
const controller = require("../controllers/providerController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get("/me", authenticate, allowRoles("provider"), controller.getMyProviderProfile);
router.patch("/me", authenticate, allowRoles("provider"), controller.updateMyProviderProfile);

module.exports = router;
