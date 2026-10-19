
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from your .env file.");
    }

    await mongoose.connect(mongoUri);

    // CHANGE THESE TO YOUR OWN ADMIN CREDENTIALS
    const name = "NUK RentServe Admin";
    const email = "admin@example.com";
    const phone = "9999999999";
    const password = "Replace-With-Your-Strong-Password123!";

    if (password.length < 12 || password.length > 72) {
      throw new Error("Password must be between 12 and 72 characters.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone }
      ]
    });

    if (existing) {
      throw new Error(
        "This email or phone already exists. No account was changed."
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "admin",
      location: "Bagalkot",
      isActive: true
    });

    console.log("Admin account created successfully!");
    console.log("Admin email:", normalizedEmail);
    console.log("Login password: the password configured in this file.");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
