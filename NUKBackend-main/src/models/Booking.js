const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  requestedMoveInDate: { type: Date, default: null },
  message: { type: String, trim: true, maxlength: 1500, default: "" },
  status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled"], default: "pending", index: true }
}, { timestamps: true });

bookingSchema.index({ customerId: 1, propertyId: 1, status: 1 });
module.exports = mongoose.model("Booking", bookingSchema);
