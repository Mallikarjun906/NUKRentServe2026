const router = require("express").Router();
const controller = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get("/", controller.listReviews);
router.post("/", authenticate, allowRoles("customer"), controller.createReview);
router.delete("/:id", authenticate, controller.deleteReview);

module.exports = router;
