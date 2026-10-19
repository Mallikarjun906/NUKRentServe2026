const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Authentication token required.");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  const user = await User.findById(payload.sub).select("name email role isActive");
  if (!user || !user.isActive) throw new ApiError(401, "Account not found or inactive.");
  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
});

module.exports = { authenticate };
