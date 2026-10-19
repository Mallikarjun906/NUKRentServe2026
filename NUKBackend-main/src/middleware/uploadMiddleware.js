const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = cloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: "student-connect/listings",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      })
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) return cb(new ApiError(400, "Only JPEG, PNG, and WebP images are allowed."));
    if (!cloudinaryConfigured) return cb(new ApiError(503, "Image uploads are not configured. Set Cloudinary environment variables."));
    cb(null, true);
  }
});

function uploadListingImages(req, res, next) {
  upload.array("images", 10)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

module.exports = { uploadListingImages };
