
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PasswordResetToken = require("../models/PasswordResetToken");
const {
  sendPasswordResetEmail
} = require("../services/passwordResetEmailService");

const hashToken = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const genericMessage =
  "If an account exists for this email, password-reset instructions will be sent.";

const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.length <= 254;

async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!validEmail(email)) {
    return res.status(200).json({
      success: true,
      message: genericMessage
    });
  }

  try {
    const user = await User.findOne({
      email,
      isActive: true
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage
      });
    }

    await PasswordResetToken.deleteMany({
      userId: user._id
    });

    const token = crypto.randomBytes(32).toString("hex");

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      await PasswordResetToken.deleteMany({
        userId: user._id
      });
      throw new Error("FRONTEND_URL is missing from .env");
    }

    // Preserve the frontend folder path in the URL.
    const resetUrl = new URL(
      "reset-password.html",
      frontendUrl.endsWith("/")
        ? frontendUrl
        : `${frontendUrl}/`
    );

    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("email", email);

    try {
      await sendPasswordResetEmail(
        email,
        resetUrl.toString()
      );
    } catch (error) {
      await PasswordResetToken.deleteMany({
        userId: user._id
      });
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: genericMessage
    });
  } catch (error) {
    console.error(
      "Password reset request failed:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to process your request right now."
    });
  }
}

async function resetPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const token = String(req.body.token || "");
  const password = req.body.password;

  if (
    !validEmail(email) ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset request."
    });
  }

  try {
    const user = await User.findOne({
      email,
      isActive: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link."
      });
    }

    const record = await PasswordResetToken.findOne({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link."
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.set("refreshTokenHash", undefined);
    await user.save();

    // Consume all reset links for this user.
    await PasswordResetToken.deleteMany({
      userId: user._id
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password."
    });
  } catch (error) {
    console.error(
      "Password reset failed:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password right now."
    });
  }
}

module.exports = {
  forgotPassword,
  resetPassword
};
