const mongoose = require("mongoose");
const ServiceListing = require("../models/ServiceListing");
const ServiceCategory = require("../models/ServiceCategory");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { filesToImageRecords, deleteCloudinaryImages } = require("../services/imageService");

const listJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { listingType: "job", status: "published", availability: true };
  if (req.query.location) filter.location = { $regex: String(req.query.location).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), $options: "i" };
  if (req.query.categoryId && mongoose.isValidObjectId(req.query.categoryId)) filter.categoryId = req.query.categoryId;
  if (req.query.maxPay && Number.isFinite(Number(req.query.maxPay))) filter["priceRange.max"] = { $lte: Number(req.query.maxPay) };
  if (req.query.search) filter.$or = [
    { title: { $regex: String(req.query.search).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), $options: "i" } },
    { description: { $regex: String(req.query.search).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), $options: "i" } }
  ];
  const [items, total] = await Promise.all([
    ServiceListing.find(filter).populate("providerId", "name phone location").populate("categoryId", "name slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ServiceListing.countDocuments(filter)
  ]);
  res.json(new ApiResponse(200, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

const createJob = asyncHandler(async (req, res) => {
  const { categoryId, title, description, location, priceRange, payUnit, workHours, requiredSkills } = req.body;
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) throw new ApiError(400, "A valid categoryId is required.");
  const category = await ServiceCategory.findOne({ _id: categoryId, isActive: true });
  if (!category) throw new ApiError(400, "Active service category not found.");
  let parsedPrice = priceRange;
  if (typeof parsedPrice === "string") { try { parsedPrice = JSON.parse(parsedPrice); } catch { throw new ApiError(400, "priceRange must be JSON with min and max."); } }
  if (!title || !description || !location || !parsedPrice || parsedPrice.min == null || parsedPrice.max == null) throw new ApiError(400, "title, description, location and priceRange.min/max are required.");
  if (Number(parsedPrice.min) > Number(parsedPrice.max)) throw new ApiError(400, "priceRange.min cannot exceed priceRange.max.");
  const item = await ServiceListing.create({ providerId: req.user.id, categoryId, listingType: "job", title, description, location, priceRange: parsedPrice, payUnit: payUnit || "hour", workHours, requiredSkills: parseArray(requiredSkills), images: filesToImageRecords(req.files) });
  res.status(201).json(new ApiResponse(201, item, "Job posted successfully."));
});

const getJob = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findOne({ _id: req.params.id, listingType: "job" }).populate("providerId", "name phone location").populate("categoryId", "name slug");
  if (!item || (item.status !== "published" && item.providerId?._id.toString() !== req.user?.id && req.user?.role !== "admin")) throw new ApiError(404, "Job not found.");
  res.json(new ApiResponse(200, item));
});

const updateJob = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findOne({ _id: req.params.id, listingType: "job" });
  if (!item) throw new ApiError(404, "Job not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this job.");
  const allowed = ["categoryId", "title", "description", "location", "priceRange", "payUnit", "workHours", "requiredSkills", "availability", "status"];
  for (const key of allowed) if (req.body[key] !== undefined) {
    if (["priceRange", "requiredSkills"].includes(key)) item[key] = parseArrayOrObject(req.body[key], key);
    else item[key] = req.body[key];
  }
  if (item.priceRange.min > item.priceRange.max) throw new ApiError(400, "priceRange.min cannot exceed priceRange.max.");
  if (req.files?.length) item.images.push(...filesToImageRecords(req.files));
  if (item.images.length > 8) throw new ApiError(400, "Maximum 8 images per job.");
  await item.save();
  res.json(new ApiResponse(200, item, "Job updated."));
});

const deleteJob = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findOne({ _id: req.params.id, listingType: "job" });
  if (!item) throw new ApiError(404, "Job not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot delete this job.");
  await deleteCloudinaryImages(item.images);
  await item.deleteOne();
  res.json(new ApiResponse(200, null, "Job deleted."));
});

const deleteJobImage = asyncHandler(async (req, res) => {
  const item = await ServiceListing.findOne({ _id: req.params.id, listingType: "job" });
  if (!item) throw new ApiError(404, "Job not found.");
  if (item.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this job.");
  const image = item.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, "Image not found.");
  await deleteCloudinaryImages([image]);
  image.deleteOne(); await item.save();
  res.json(new ApiResponse(200, item, "Image deleted."));
});

function parseArray(value) { return parseArrayOrObject(value, "requiredSkills"); }
function parseArrayOrObject(value, key) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { throw new ApiError(400, `${key} must be valid JSON when sent as form data.`); }
}
module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, deleteJobImage };
