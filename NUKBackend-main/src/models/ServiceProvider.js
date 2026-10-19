const mongoose = require("mongoose");

const serviceProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  displayName: { type: String, trim: true, maxlength: 100 },
  bio: { type: String, trim: true, maxlength: 2000, default: "" },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  experienceYears: { type: Number, min: 0, max: 80, default: 0 },
  verificationStatus: { type: String, enum: ["unverified", "pending", "info", "verified", "rejected"], default: "unverified" },
  reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  profileImage: { url: String, publicId: String }
}, { timestamps: true });

module.exports = mongoose.model("ServiceProvider", serviceProviderSchema);
