const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  listingType: { type: String, enum: ["service", "property"], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1500, default: "" }
}, { timestamps: true });

reviewSchema.index({ reviewerId: 1, listingId: 1, listingType: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
