const Enquiry = require("../models/Enquiry");
const ServiceListing = require("../models/ServiceListing");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const createEnquiry = asyncHandler(async (req, res) => {
  const { listingId, listingType, message } = req.body;
  if (!listingId || !listingType || !message) throw new ApiError(400, "listingId, listingType and message are required.");
  const Model = listingType === "service" ? ServiceListing : listingType === "property" ? Property : null;
  if (!Model) throw new ApiError(400, "listingType must be service or property.");
  const listing = await Model.findById(listingId);
  if (!listing || listing.status !== "published") throw new ApiError(404, "Listing not found.");
  const ownerId = listingType === "service" ? listing.providerId.toString() : listing.ownerId.toString();
  if (ownerId === req.user.id) throw new ApiError(400, "You cannot enquire about your own listing.");
  const enquiry = await Enquiry.create({ customerId: req.user.id, listingId, listingType, message });
  res.status(201).json(new ApiResponse(201, enquiry, "Enquiry submitted."));
});

const myEnquiries = asyncHandler(async (req, res) => {
  const items = await Enquiry.find({ customerId: req.user.id }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, items));
});

const enquiriesForMyListings = asyncHandler(async (req, res) => {
  const [services, properties] = await Promise.all([
    ServiceListing.find({ providerId: req.user.id }).select("_id"),
    Property.find({ ownerId: req.user.id }).select("_id")
  ]);
  const listingIds = [...services, ...properties].map((item) => item._id);
  const filter = req.user.role === "admin" ? {} : { listingId: { $in: listingIds } };
  const items = await Enquiry.find(filter).populate("customerId", "name email phone").sort({ createdAt: -1 });
  res.json(new ApiResponse(200, items));
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  if (req.user.role !== "admin") {
    const Model = enquiry.listingType === "service" ? ServiceListing : Property;
    const field = enquiry.listingType === "service" ? "providerId" : "ownerId";
    const listing = await Model.findById(enquiry.listingId).select(field);
    if (!listing || listing[field].toString() !== req.user.id) throw new ApiError(403, "You cannot update this enquiry.");
  }
  const allowed = ["contacted", "accepted", "rejected", "closed"];
  if (!allowed.includes(req.body.contactStatus)) throw new ApiError(400, `contactStatus must be one of: ${allowed.join(", ")}`);
  enquiry.contactStatus = req.body.contactStatus;
  await enquiry.save();
  res.json(new ApiResponse(200, enquiry, "Enquiry status updated."));
});

module.exports = { createEnquiry, myEnquiries, enquiriesForMyListings, updateEnquiryStatus };
