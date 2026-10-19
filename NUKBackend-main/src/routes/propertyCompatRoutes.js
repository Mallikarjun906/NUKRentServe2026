const router = require("express").Router();
const mongoose = require("mongoose");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const esc = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function shape(item) {
  return { ...item.toObject(), id: item.id, city: item.location, locality: item.address, available: Boolean(item.availability), icon: item.type === "pg" ? "🏢" : "🏠" };
}
router.get("/mine", authenticate, allowRoles("customer", "owner", "provider", "admin"), async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { ownerId: req.user.id };
    const items = await Property.find(filter).populate("ownerId", "name phone location").sort({ createdAt: -1 }).limit(100);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = { status: "published", availability: true };
    if (req.query.type) { const t = String(req.query.type).toLowerCase(); filter.type = t === "pg" ? "PG" : t; }
    const location = req.query.location || req.query.city;
    if (location) filter.location = { $regex: esc(location), $options: "i" };
    const min = Number(req.query.minRent), max = Number(req.query.maxRent || req.query.max);
    if (Number.isFinite(min) && min > 0 || Number.isFinite(max) && max > 0) filter.rent = { ...(Number.isFinite(min) && min > 0 ? {$gte:min} : {}), ...(Number.isFinite(max) && max > 0 ? {$lte:max} : {}) };
    const search = req.query.search || req.query.q;
    if (search) filter.$or = [{title:{$regex:esc(search),$options:"i"}},{address:{$regex:esc(search),$options:"i"}},{description:{$regex:esc(search),$options:"i"}}];
    const items = await Property.find(filter).populate("ownerId", "name phone location").sort({createdAt:-1}).limit(50);
    return res.json(new ApiResponse(200, items.map(shape)));
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, "Property not found.");
    const item = await Property.findById(req.params.id).populate("ownerId", "name phone location");
    if (!item || item.status !== "published") throw new ApiError(404, "Property not found.");
    return res.json(new ApiResponse(200, shape(item)));
  } catch (e) { next(e); }
});
module.exports = router;
