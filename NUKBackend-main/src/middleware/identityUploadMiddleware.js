const multer = require("multer");
const ApiError = require("../utils/ApiError");

const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new ApiError(400, "Upload the Aadhaar document as JPG, PNG, or PDF (max 5 MB)."));
    cb(null, true);
  }
});
function uploadAadhaarDocument(req, res, next) {
  upload.single("aadhaarDocument")(req, res, err => err ? next(err) : next());
}
module.exports = { uploadAadhaarDocument };
