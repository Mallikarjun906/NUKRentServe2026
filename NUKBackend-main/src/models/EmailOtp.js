const mongoose = require("mongoose");
const schema = new mongoose.Schema({
 email: { type: String, required: true, lowercase: true, trim: true, index: true },
 purpose: { type: String, required: true, enum: ["provider-registration", "customer-registration"], default: "provider-registration" },
 otpHash: { type: String, required: true },
 expiresAt: { type: Date, required: true, index: { expires: 0 } },
 attempts: { type: Number, default: 0 },
 lastSentAt: { type: Date, default: Date.now },
 verifiedAt: { type: Date, default: null },
 verificationTokenHash: { type: String, default: "" },
 consumedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ email: 1, purpose: 1, createdAt: -1 });
module.exports = mongoose.model("EmailOtp", schema);
