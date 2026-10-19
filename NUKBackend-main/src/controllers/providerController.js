const ServiceProvider = require("../models/ServiceProvider");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getMyProviderProfile = asyncHandler(async (req, res) => {
  const profile = await ServiceProvider.findOne({ userId: req.user.id }).populate("userId", "name email location");
  if (!profile) throw new ApiError(404, "Provider profile not found.");
  res.json(new ApiResponse(200, profile));
});

const updateMyProviderProfile = asyncHandler(async (req, res) => {
  const allowed = ["displayName", "bio", "skills", "experienceYears"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const profile = await ServiceProvider.findOneAndUpdate(
    { userId: req.user.id }, { $set: updates }, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(new ApiResponse(200, profile, "Provider profile updated."));
});

module.exports = { getMyProviderProfile, updateMyProviderProfile };
