
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ProviderApplication = require("../models/ProviderApplication");
const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const EmailOtp = require("../models/EmailOtp");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");

const SUPPORTED_CITIES = [
  "Bagalkot",
  "Belagavi",
  "Hubballi",
  "Dharwad",
  "Vijayapura",
  "Gadag",
  "Koppal",
];

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const accessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const refreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

function uploadPrivateDocument(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "nuk-rentserve/private-aadhaar-documents",
          resource_type: resourceType,
          type: "authenticated",
          access_mode: "authenticated",
          use_filename: false,
          unique_filename: true,
        },
        (error, result) =>
          error ? reject(error) : resolve(result)
      )
      .end(buffer);
  });
}

const submit = asyncHandler(async (req, res) => {
  const {
    fullName,
    dob,
    phone,
    email,
    password,
    address,
    serviceArea,
    area,
    city,
    category,
    experience,
    price,
    description,
    consent,
    terms,
  } = req.body;

  if (
    !fullName ||
    !dob ||
    !phone ||
    !email ||
    !password ||
    !city ||
    !category ||
    !description
  ) {
    throw new ApiError(
      400,
      "Please complete all required provider application fields."
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain 8–72 characters.");
  }

  const birth = new Date(dob);

  if (!Number.isFinite(birth.getTime()) || birth > new Date()) {
    throw new ApiError(400, "Please provide a valid date of birth.");
  }

  let age = new Date().getFullYear() - birth.getFullYear();
  const month = new Date().getMonth() - birth.getMonth();

  if (
    month < 0 ||
    (month === 0 && new Date().getDate() < birth.getDate())
  ) {
    age--;
  }

  if (age < 18) {
    throw new ApiError(
      400,
      "Service providers must be at least 18 years old."
    );
  }

  if (!SUPPORTED_CITIES.includes(city)) {
    throw new ApiError(400, "Please choose one of the supported cities.");
  }

  if (!(terms === true || terms === "on" || terms === "true")) {
    throw new ApiError(400, "You must accept the terms of service.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const verificationToken = String(req.body.emailVerificationToken || "");
  if (!/^[a-f0-9]{64}$/i.test(verificationToken)) throw new ApiError(400, "Verify your email address before submitting your application.");
  const tokenHash = hashToken(verificationToken);
  const verifiedOtp = await EmailOtp.findOne({ email: normalizedEmail, purpose: "provider-registration", verificationTokenHash: tokenHash, verifiedAt: { $ne: null }, consumedAt: null, expiresAt: { $gt: new Date() } });
  if (!verifiedOtp) throw new ApiError(400, "Email verification is missing or expired. Please verify your email again.");

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(
      409,
      "This email is already registered. Please log in instead."
    );
  }

  // Aadhaar image is optional for testing.
  const aadhaarFile = req.file;
  let uploadedDocument = null;

  if (aadhaarFile) {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(aadhaarFile.mimetype)) {
      throw new ApiError(400, "Upload a JPG, PNG or PDF document.");
    }

    if (aadhaarFile.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "The image must be 5 MB or smaller.");
    }

    if (!(consent === true || consent === "on" || consent === "true")) {
      throw new ApiError(
        400,
        "Consent is required when uploading an identity document."
      );
    }

    if (!cloudinaryConfigured) {
      throw new ApiError(
        503,
        "Cloudinary is not configured. For testing, register without an Aadhaar image."
      );
    }

    try {
      uploadedDocument = await uploadPrivateDocument(
        aadhaarFile.buffer,
        aadhaarFile.mimetype === "application/pdf" ? "raw" : "image"
      );
    } catch (error) {
      console.error("Private document upload failed:", error.message);
      throw new ApiError(
        502,
        "The image could not be uploaded securely. Please try again."
      );
    }
  }

  const user = await User.create({
    name: String(fullName).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    password: await bcrypt.hash(password, 12),
    role: "provider",
    location: city,
  });

  await ServiceProvider.create({
    userId: user._id,
    displayName: user.name,
    bio: String(description).trim(),
    verificationStatus: "pending",
  });

  const applicationData = {
    userId: user._id,
    fullName: user.name,
    phone: user.phone,
    email: user.email,
    address: String(address || "").trim(),
    serviceArea: String(serviceArea || area || "").trim(),
    city,
    category: String(category).trim(),
    experience: String(experience || "").trim(),
    price: String(price || "").trim(),
    description: String(description).trim(),
    consent: Boolean(
      consent === true || consent === "on" || consent === "true"
    ),
    status: "pending",
  };

  if (uploadedDocument) {
    applicationData.aadhaarDocument = {
      publicId: uploadedDocument.public_id,
      resourceType: aadhaarFile.mimetype === "application/pdf" ? "raw" : "image",
      mimeType: aadhaarFile.mimetype,
      uploadedAt: new Date(),
    };
  }

  const application = await ProviderApplication.create(applicationData);
  verifiedOtp.consumedAt = new Date();
  verifiedOtp.verificationTokenHash = "";
  await verifiedOtp.save();

  const newAccessToken = accessToken(user);
  const newRefreshToken = refreshToken(user);

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        application: {
          id: application.id,
          status: application.status,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Provider account created; application submitted for manual review."
    )
  );
});

module.exports = { submit };
