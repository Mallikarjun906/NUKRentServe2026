const ApiError = require("../utils/ApiError");

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || "Internal server error.";
  if (err.name === "ValidationError") { status = 400; message = err.message; }
  if (err.name === "CastError") { status = 400; message = "Invalid resource ID."; }
  if (err.code === 11000) { status = 409; message = "A record with this value already exists."; }
  if (err.name === "MulterError") { status = 400; message = err.message; }
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && err.details ? { details: err.details } : {})
  });
}

module.exports = { notFound, errorHandler };
