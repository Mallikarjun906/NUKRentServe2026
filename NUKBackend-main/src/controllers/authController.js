
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const EmailOtp = require("../models/EmailOtp");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const googleClient = new OAuth2Client();

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    location: user.location
  };
}

async function createSession(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { user: sessionUser(user), accessToken, refreshToken };
}

/* Traditional registration */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, emailVerificationToken } = req.body;
  const location = req.body.location || req.body.city || "Bagalkot";

  if (!name || !email || !phone || !password || !location) {
    throw new ApiError(
      400,
      "name, email, phone, password and location are required."
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain 8–72 characters.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "Email is already registered.");
  }

  // Never allow public registration to create privileged accounts.
  const safeRole =
    role === "owner" || role === "propertyOwner" ? "owner" : "customer";

  if (!/^[a-f0-9]{64}$/i.test(String(emailVerificationToken || ""))) {
    throw new ApiError(400, "Verify your email address before creating an account.");
  }

  const otpHash = hashToken(String(emailVerificationToken));
  const verifiedOtp = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: "customer-registration",
    verificationTokenHash: otpHash,
    verifiedAt: { $ne: null },
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!verifiedOtp) {
    throw new ApiError(
      400,
      "Email verification is missing or expired. Please verify your email again."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password: hashedPassword,
    role: safeRole,
    location
  });

  verifiedOtp.consumedAt = new Date();
  verifiedOtp.verificationTokenHash = "";
  await verifiedOtp.save();

  const session = await createSession(user);

  return res.status(201).json(
    new ApiResponse(201, session, "Registration successful.")
  );
});

/* Traditional email/mobile and password login */
const login = asyncHandler(async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginId = String(identifier || email || "").trim();

  if (!loginId || !password) {
    throw new ApiError(400, "Email/mobile number and password are required.");
  }

  const user = await User.findOne({
    $or: [
      { email: loginId.toLowerCase() },
      { phone: loginId }
    ]
  }).select("+password +refreshTokenHash");

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive.");
  }

  const session = await createSession(user);

  return res.json(new ApiResponse(200, session, "Login successful."));
});

/* Google Sign-In: server verifies Google's ID token */
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body || {};

  if (typeof credential !== "string" || !credential) {
    throw new ApiError(400, "Google credential is required.");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, "Google Sign-In is not configured.");
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
  } catch {
    throw new ApiError(401, "Google verification failed. Please try again.");
  }

  const profile = ticket.getPayload();

  if (!profile || !profile.sub || !profile.email || profile.email_verified !== true) {
    throw new ApiError(401, "A verified Google email is required.");
  }

  const email = profile.email.trim().toLowerCase();

  let user = await User.findOne({
    $or: [
      { googleId: profile.sub },
      { email }
    ]
  }).select("+password +refreshTokenHash");

  if (user && !user.isActive) {
    throw new ApiError(403, "Account is inactive.");
  }

  if (user && user.googleId && user.googleId !== profile.sub) {
    throw new ApiError(409, "This email is linked to another Google account.");
  }

  if (user) {
    // Do not automatically link an existing password account.
    // Require its owner to sign in using the existing method first.
    if (!user.googleId) {
      throw new ApiError(
        409,
        "An account with this email already exists. Sign in with your existing method first."
      );
    }
  } else {
    user = await User.create({
      name: String(profile.name || email.split("@")[0]).slice(0, 100),
      email,
      googleId: profile.sub,
      phone: "",
      role: "customer",
      location: "Bagalkot"
    });
  }

  const session = await createSession(user);

  return res.status(200).json(
    new ApiResponse(200, session, "Google login successful.")
  );
});

/* Refresh the current JWT session */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    throw new ApiError(400, "refreshToken is required.");
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token.");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");

  if (
    !user ||
    !user.isActive ||
    !user.refreshTokenHash ||
    user.refreshTokenHash !== hashToken(refreshToken)
  ) {
    throw new ApiError(401, "Refresh token has been revoked.");
  }

  const nextAccessToken = createAccessToken(user);
  const nextRefreshToken = createRefreshToken(user);

  user.refreshTokenHash = hashToken(nextRefreshToken);
  await user.save();

  return res.json(
    new ApiResponse(200, {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    })
  );
});

/* Logout */
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $unset: { refreshTokenHash: 1 }
  });

  return res.json(new ApiResponse(200, null, "Logged out."));
});

module.exports = {
  register,
  login,
  googleLogin,
  refresh,
  logout
};
