const router = require("express").Router();
const controller = require("../controllers/propertyController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { uploadListingImages } = require("../middleware/uploadMiddleware");

router.get("/", controller.listProperties);
router.get("/:id", controller.getProperty);
router.post("/", authenticate, allowRoles("customer", "owner", "provider"), uploadListingImages, controller.createProperty);
router.patch("/:id", authenticate, allowRoles("customer", "owner", "provider", "admin"), uploadListingImages, controller.updateProperty);
router.delete("/:id", authenticate, allowRoles("customer", "owner", "provider", "admin"), controller.deleteProperty);
router.delete("/:id/images/:imageId", authenticate, allowRoles("customer", "owner", "provider", "admin"), controller.deletePropertyImage);

module.exports = router;
