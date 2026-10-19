const Review = require("../models/Review");
const ServiceListing = require("../models/ServiceListing");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const createReview = asyncHandler(async (req, res) => {
  const { listingId, listingType, rating, comment = "" } = req.body;
  if (!listingId || !listingType || rating === undefined) throw new ApiError(400, "listingId, listingType and rating are required.");
  const Model = listingType === "service" ? ServiceListing : listingType === "property" ? Property : null;
  if (!Model) throw new ApiError(400, "listingType must be service or property.");
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) throw new ApiError(400, "rating must be an integer from 1 to 5.");
  const listing = await Model.findById(listingId);
  if (!listing) throw new ApiError(404, "Listing not found.");
  const review = await Review.create({ reviewerId: req.user.id, listingId, listingType, rating: Number(rating), comment });
  res.status(201).json(new ApiResponse(201, review, "Review created."));
});

const listReviews = asyncHandler(async (req, res) => {
  const { listingId, listingType } = req.query;
  const filter = {};
  if (listingId) filter.listingId = listingId;
  if (listingType) filter.listingType = listingType;
  const reviews = await Review.find(filter).populate("reviewerId", "name").sort({ createdAt: -1 });
  res.json(new ApiResponse(200, reviews));
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found.");
  if (review.reviewerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot delete this review.");
  await review.deleteOne();
  res.json(new ApiResponse(200, null, "Review deleted."));
});

module.exports = { createReview, listReviews, deleteReview };
