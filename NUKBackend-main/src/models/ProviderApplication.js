const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  address: { type: String, trim: true, maxlength: 300, default: "" },
  serviceArea: { type: String, trim: true, maxlength: 200, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  city: { type: String, required: true, enum: ["Bagalkot", "Belagavi", "Hubballi", "Dharwad", "Vijayapura", "Gadag", "Koppal"] },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  experience: { type: String, trim: true, maxlength: 80, default: "" },
  price: { type: String, trim: true, maxlength: 100, default: "" },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  consent: { type: Boolean, required: true, default: false },
  aadhaarDocument: { publicId: { type: String, default: "" }, resourceType: { type: String, enum: ["image", "raw", ""], default: "" }, mimeType: { type: String, enum: ["image/jpeg", "image/png", "application/pdf", ""], default: "" }, uploadedAt: { type: Date, default: null } },
  status: { type: String, enum: ["pending", "info", "approved", "rejected"], default: "pending", index: true },
  reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  identityReviewStatus: { type: String, enum: ["not_checked", "match", "possible_mismatch", "manual_review_required"], default: "not_checked" },
  aadhaarName: { type: String, trim: true, maxlength: 100, default: "" },
  identityReviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  identityReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  identityReviewedAt: { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model("ProviderApplication", schema);
