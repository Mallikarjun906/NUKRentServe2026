const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  listingType: { type: String, enum: ["service", "property"], required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  contactStatus: { type: String, enum: ["pending", "contacted", "accepted", "rejected", "closed"], default: "pending", index: true }
}, { timestamps: true });

enquirySchema.index({ customerId: 1, listingId: 1, listingType: 1 }, { unique: true });

module.exports = mongoose.model("Enquiry", enquirySchema);
