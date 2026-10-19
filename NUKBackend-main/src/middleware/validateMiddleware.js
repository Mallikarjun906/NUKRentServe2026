const ApiError = require("../utils/ApiError");

function validateBody(requiredFields = []) {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");
    if (missing.length) return next(new ApiError(400, `Missing required fields: ${missing.join(", ")}`));
    next();
  };
}

module.exports = { validateBody };
