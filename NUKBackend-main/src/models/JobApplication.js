const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceListing", required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  coverMessage: { type: String, trim: true, maxlength: 2000, default: "" },
  status: { type: String, enum: ["pending", "shortlisted", "accepted", "rejected", "withdrawn"], default: "pending", index: true },
  ownerNote: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });

jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model("JobApplication", jobApplicationSchema);
