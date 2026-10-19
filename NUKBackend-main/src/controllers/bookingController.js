const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const { propertyId, requestedMoveInDate, message = "" } = req.body;
  if (!propertyId || !mongoose.isValidObjectId(propertyId)) throw new ApiError(400, "Choose a valid property.");
  const property = await Property.findOne({ _id: propertyId, status: "published", availability: true });
  if (!property) throw new ApiError(404, "This property is not available for booking.");
  if (property.ownerId.toString() === req.user.id) throw new ApiError(400, "You cannot book your own property.");
  if (requestedMoveInDate && Number.isNaN(new Date(requestedMoveInDate).getTime())) throw new ApiError(400, "Enter a valid move-in date.");
  const booking = await Booking.create({
    customerId: req.user.id,
    ownerId: property.ownerId,
    propertyId: property._id,
    requestedMoveInDate: requestedMoveInDate || null,
    message: String(message).trim()
  });
  res.status(201).json(new ApiResponse(201, booking, "Booking request sent to the property owner."));
});

const mine = asyncHandler(async (req, res) => {
  const items = await Booking.find({ customerId: req.user.id }).populate("propertyId").populate("ownerId", "name phone email").sort({ createdAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const received = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { ownerId: req.user.id };
  const items = await Booking.find(filter).populate("propertyId").populate("customerId", "name phone email").sort({ createdAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected", "cancelled"].includes(status)) throw new ApiError(400, "Status must be accepted, rejected, or cancelled.");
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking request not found.");
  const isOwner = booking.ownerId.toString() === req.user.id;
  const isCustomerCancelling = booking.customerId.toString() === req.user.id && status === "cancelled";
  if (!isOwner && !isCustomerCancelling && req.user.role !== "admin") throw new ApiError(403, "You cannot update this booking request.");
  if (booking.status !== "pending") throw new ApiError(409, "This booking request has already been processed.");
  booking.status = status;
  await booking.save();
  res.json(new ApiResponse(200, booking, "Booking status updated."));
});

module.exports = { create, mine, received, updateStatus };
