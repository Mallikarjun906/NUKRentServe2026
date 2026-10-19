const User = require("../models/User");
const ServiceListing = require("../models/ServiceListing");
const Property = require("../models/Property");
const ProviderApplication = require("../models/ProviderApplication");
const ServiceProvider = require("../models/ServiceProvider");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const [users, total] = await Promise.all([
    User.find(filter).select("name email phone role location isActive createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json(new ApiResponse(200, { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

const setUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot deactivate your own account.");
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(req.body.isActive) }, { new: true, runValidators: true })
    .select("name email role isActive");
  if (!user) throw new ApiError(404, "User not found.");
  res.json(new ApiResponse(200, user, "User status updated."));
});

const dashboardStats = asyncHandler(async (req, res) => {
  const [users, services, properties] = await Promise.all([
    User.countDocuments(), ServiceListing.countDocuments(), Property.countDocuments()
  ]);
  res.json(new ApiResponse(200, { users, services, properties }));
});

const listProviderApplications = asyncHandler(async (req, res) => {
  const items = await ProviderApplication.find({ status: { $in: ["pending", "info"] } }).sort({ createdAt: -1 }).limit(100);
  res.json(new ApiResponse(200, items.map(item => ({
    id: item.id, name: item.fullName, email: item.email, phone: item.phone,
    category: item.category, city: item.city, submitted: item.createdAt,
    status: item.status, note: item.reviewNote, aadhaarDocumentAvailable: Boolean(item.aadhaarDocument && item.aadhaarDocument.publicId),
    aadhaarName: item.aadhaarName || "", identityReviewStatus: item.identityReviewStatus || "not_checked", identityReviewNote: item.identityReviewNote || "", address: item.address || "", experience: item.experience || "", description: item.description || ""
  }))));
});

const decideProviderApplication = asyncHandler(async (req, res) => {
  const { decision, note = "" } = req.body;
  if (!["approve", "info", "reject"].includes(decision)) throw new ApiError(400, "decision must be approve, info, or reject.");
  const application = await ProviderApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Provider application not found.");
  if (decision === "approve" && application.aadhaarDocument && application.aadhaarDocument.publicId && application.identityReviewStatus !== "match") throw new ApiError(400, "Review the uploaded identity document and mark the name as matched before approval.");
  application.status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "info";
  application.reviewNote = String(note).slice(0, 500);
  await application.save();
  if (application.userId) {
    const verificationStatus = decision === "approve" ? "verified" : decision === "reject" ? "rejected" : "info";
    await ServiceProvider.findOneAndUpdate({ userId: application.userId }, { verificationStatus, reviewNote: application.reviewNote });
    if (decision === "approve") {
      await Promise.all([
        ServiceListing.updateMany({ providerId: application.userId, status: "draft" }, { $set: { status: "published" } }),
        Property.updateMany({ ownerId: application.userId, status: "draft" }, { $set: { status: "published" } })
      ]);
    }
  }
  res.json(new ApiResponse(200, {
    id: application.id, status: application.status, reviewNote: application.reviewNote
  }, "Provider application decision saved."));
});


const reviewIdentity = asyncHandler(async (req, res) => {
  const { status, aadhaarName = "", note = "" } = req.body;
  if (!["match", "possible_mismatch", "manual_review_required"].includes(status)) throw new ApiError(400, "Choose a valid identity review status.");
  const application = await ProviderApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Provider application not found.");
  application.identityReviewStatus = status;
  application.aadhaarName = String(aadhaarName).trim().slice(0, 100);
  application.identityReviewNote = String(note).trim().slice(0, 500);
  application.identityReviewedBy = req.user.id;
  application.identityReviewedAt = new Date();
  await application.save();
  res.json(new ApiResponse(200, { id: application.id, identityReviewStatus: application.identityReviewStatus, identityReviewedAt: application.identityReviewedAt }, "Identity review saved."));
});

const viewApplicationDocument = asyncHandler(async (req, res) => {
  const application = await ProviderApplication.findById(req.params.id).select("aadhaarDocument");
  if (!application) throw new ApiError(404, "Provider application not found.");
  const doc = application.aadhaarDocument;
  if (!doc || !doc.publicId) throw new ApiError(404, "No identity document was uploaded.");
  if (!cloudinaryConfigured) throw new ApiError(503, "Private document storage is not configured.");
  const mimeType = doc.mimeType || (doc.resourceType === "raw" ? "application/pdf" : "image/jpeg");
  const ext = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";
  let signedUrl;
  try {
    signedUrl = cloudinary.utils.private_download_url(doc.publicId, ext, { resource_type: doc.resourceType || "image", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60 });
  } catch (error) {
    console.error("Private document URL generation failed:", error.message);
    throw new ApiError(502, "Unable to securely retrieve this document.");
  }
  let upstream;
  try { upstream = await fetch(signedUrl, { redirect: "error", signal: AbortSignal.timeout(15000) }); }
  catch (error) { console.error("Private document retrieval failed:", error.message); throw new ApiError(502, "Unable to retrieve the private document from storage."); }
  if (!upstream.ok) throw new ApiError(502, "Private document storage could not return this document.");
  const bytes = Buffer.from(await upstream.arrayBuffer());
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new ApiError(502, "The stored document is empty or exceeds the allowed size.");
  res.set("Cache-Control", "no-store, private");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Type", mimeType);
  res.set("Content-Disposition", `inline; filename="identity-document.${ext}"`);
  res.status(200).send(bytes);
});

module.exports = { listUsers, setUserStatus, dashboardStats, listProviderApplications, decideProviderApplication, reviewIdentity, viewApplicationDocument };
