const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "owner", "provider", "admin"], default: "customer", index: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  isActive: { type: Boolean, default: true },
  refreshTokenHash: { type: String, select: false, default: undefined }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
