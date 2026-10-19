const Property = require("../models/Property");
const ServiceProvider = require("../models/ServiceProvider");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { filesToImageRecords, deleteCloudinaryImages } = require("../services/imageService");

const listProperties = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { status: "published", availability: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.location) filter.location = { $regex: String(req.query.location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (req.query.maxRent && Number.isFinite(Number(req.query.maxRent))) filter.rent = { $lte: Number(req.query.maxRent) };
  const [items, total] = await Promise.all([
    Property.find(filter).populate("ownerId", "name phone location").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Property.countDocuments(filter)
  ]);
  res.json(new ApiResponse(200, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

const getProperty = asyncHandler(async (req, res) => {
  const item = await Property.findById(req.params.id).populate("ownerId", "name phone location");
  if (!item || (item.status !== "published" && item.ownerId?._id.toString() !== req.user?.id && req.user?.role !== "admin")) {
    throw new ApiError(404, "Property not found.");
  }
  res.json(new ApiResponse(200, item));
});

const createProperty = asyncHandler(async (req, res) => {
  let { type, title, description, rent, deposit, rentPeriod, address, location, facilities } = req.body;
  if (typeof type === "string") type = type.toLowerCase() === "pg" ? "PG" : type.toLowerCase();
  if (!type || !title || rent === undefined || !address || !location) throw new ApiError(400, "type, title, rent, address and location are required.");
  let parsedFacilities = facilities || [];
  if (typeof parsedFacilities === "string") {
    try { parsedFacilities = JSON.parse(parsedFacilities); } catch { parsedFacilities = parsedFacilities.split(",").map((v) => v.trim()).filter(Boolean); }
  }
  const profile = await ServiceProvider.findOne({ userId: req.user.id }).select("verificationStatus");
  const status = ["admin", "customer", "owner"].includes(req.user.role) || profile?.verificationStatus === "verified" ? "published" : "draft";
  const item = await Property.create({
    ownerId: req.user.id, type, title, description, rent: Number(rent), deposit: Number(deposit || 0), rentPeriod, address, location,
    facilities: parsedFacilities, images: filesToImageRecords(req.files), status
  });
  res.status(201).json(new ApiResponse(201, item, "Property created."));
});

const updateProperty = asyncHandler(async (req, res) => {
  const item = await Property.findById(req.params.id);
  if (!item) throw new ApiError(404, "Property not found.");
  if (item.ownerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this property.");
  if (!["admin", "customer", "owner"].includes(req.user.role) && req.body.status === "published") {
    const profile = await ServiceProvider.findOne({ userId: req.user.id }).select("verificationStatus");
    if (profile?.verificationStatus !== "verified") throw new ApiError(403, "Your provider account must be verified before publishing listings.");
  }
  const allowed = ["type", "title", "description", "rent", "deposit", "rentPeriod", "address", "location", "facilities", "availability", "status"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "facilities" && typeof req.body[key] === "string") {
        try { item[key] = JSON.parse(req.body[key]); } catch { item[key] = req.body[key].split(",").map((v) => v.trim()).filter(Boolean); }
      } else item[key] = req.body[key];
    }
  }
  if (req.files?.length) item.images.push(...filesToImageRecords(req.files));
  if (item.images.length > 10) throw new ApiError(400, "Maximum 10 images per property.");
  await item.save();
  res.json(new ApiResponse(200, item, "Property updated."));
});

const deleteProperty = asyncHandler(async (req, res) => {
  const item = await Property.findById(req.params.id);
  if (!item) throw new ApiError(404, "Property not found.");
  if (item.ownerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot delete this property.");
  await deleteCloudinaryImages(item.images);
  await item.deleteOne();
  res.json(new ApiResponse(200, null, "Property deleted."));
});

const deletePropertyImage = asyncHandler(async (req, res) => {
  const item = await Property.findById(req.params.id);
  if (!item) throw new ApiError(404, "Property not found.");
  if (item.ownerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot edit this property.");
  const image = item.images.id(req.params.imageId);
  if (!image) throw new ApiError(404, "Image not found.");
  await deleteCloudinaryImages([image]);
  image.deleteOne();
  await item.save();
  res.json(new ApiResponse(200, item, "Image deleted."));
});

module.exports = { listProperties, getProperty, createProperty, updateProperty, deleteProperty, deletePropertyImage };
