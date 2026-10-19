require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
(async () => {
 const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
 if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PHONE || !ADMIN_PASSWORD) throw new Error("Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE and ADMIN_PASSWORD in backend .env.");
 if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 72) throw new Error("ADMIN_PASSWORD must be 12–72 characters.");
 await mongoose.connect(MONGODB_URI);
 const email = ADMIN_EMAIL.trim().toLowerCase();
 const existing = await User.findOne({ email }).select("+password");
 if (existing) { if (existing.role !== "admin") throw new Error("That email already belongs to a non-admin user. Choose a dedicated admin email."); console.log("Admin already exists; no changes made."); }
 else { await User.create({ name: ADMIN_NAME.trim(), email, phone: ADMIN_PHONE.trim(), password: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "admin", location: "Bagalkot" }); console.log("Admin account created. Remove ADMIN_PASSWORD from the environment after setup if it is no longer needed."); }
 await mongoose.disconnect();
})().catch(async e => { console.error(e.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
