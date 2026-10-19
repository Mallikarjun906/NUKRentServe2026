const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: true });

const serviceListingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  location: { type: String, required: true, trim: true, maxlength: 200, index: true },
  priceRange: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 }
  },
  payUnit: { type: String, enum: ["hour", "day", "week", "month", "fixed"], default: "hour" },
  workHours: { type: String, trim: true, maxlength: 120, default: "" },
  images: { type: [imageSchema], default: [], validate: [(v) => v.length <= 8, "Maximum 8 images per listing."] },
  availability: { type: Boolean, default: true },
  status: { type: String, enum: ["draft", "published", "filled", "closed"], default: "published", index: true }
}, { timestamps: true });

serviceListingSchema.pre("validate", function(next) {
  if (this.priceRange && this.priceRange.min > this.priceRange.max) {
    this.invalidate("priceRange.max", "Maximum price must be greater than or equal to minimum price.");
  }
  next();
});

module.exports = mongoose.model("ServiceListing", serviceListingSchema);
