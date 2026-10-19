const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: true });

const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["house", "shop", "room", "PG"], required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 5000, default: "" },
  rent: { type: Number, required: true, min: 0 },
  deposit: { type: Number, min: 0, default: 0 },
  rentPeriod: { type: String, enum: ["day", "week", "month"], default: "month" },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  location: { type: String, required: true, trim: true, maxlength: 200, index: true },
  facilities: [{ type: String, trim: true, maxlength: 80 }],
  images: { type: [imageSchema], default: [], validate: [(v) => v.length <= 10, "Maximum 10 images per property."] },
  availability: { type: Boolean, default: true, index: true },
  status: { type: String, enum: ["draft", "published", "rented", "closed"], default: "published", index: true }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
