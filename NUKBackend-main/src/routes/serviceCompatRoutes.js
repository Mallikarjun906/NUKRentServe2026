const router = require("express").Router();
const mongoose = require("mongoose");
const ServiceListing = require("../models/ServiceListing");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const esc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function shape(item) {
  return { ...item.toObject(), id: item.id, name: item.title, city: item.location, category: item.categoryId?.name || "Service", experience: item.providerId?.experienceYears ? `${item.providerId.experienceYears} years` : "Local professional", price: item.priceRange?.min != null ? `₹${item.priceRange.min}${item.priceRange.max != null && item.priceRange.max !== item.priceRange.min ? `–₹${item.priceRange.max}` : "+"}` : "Contact for price", icon: "🛠️" };
}
router.get("/mine", authenticate, allowRoles("provider", "admin"), async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { providerId: req.user.id };
    const items = await ServiceListing.find(filter).populate("providerId", "name phone location").populate("categoryId", "name slug").sort({ createdAt: -1 }).limit(100);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = { status: "published" };
    const location = req.query.location || req.query.city;
    if (location) filter.location = { $regex: esc(location), $options: "i" };
    if (req.query.category) { const c = await require("../models/ServiceCategory").findOne({ name: { $regex: esc(req.query.category), $options: "i" }, isActive: true }); if (c) filter.categoryId = c._id; else return res.json(new ApiResponse(200, [])); }
    const search = req.query.search || req.query.q;
    if (search) filter.$or = [{title:{$regex:esc(search),$options:"i"}},{description:{$regex:esc(search),$options:"i"}}];
    const items = await ServiceListing.find(filter).populate("providerId", "name phone location").populate("categoryId", "name slug").sort({createdAt:-1}).limit(50);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Service listing not found.");
    const item = await ServiceListing.findById(req.params.id).populate("providerId", "name phone location").populate("categoryId", "name slug");
    if (!item || item.status !== "published") throw new ApiError(404, "Service listing not found.");
    return res.json(new ApiResponse(200, shape(item)));
  } catch (e) { next(e); }
});
module.exports = router;
