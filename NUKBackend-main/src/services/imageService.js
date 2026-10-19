const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

function filesToImageRecords(files = []) {
  return files.map((file) => ({
    url: file.path || file.secure_url,
    publicId: file.filename || file.public_id
  })).filter((image) => image.url && image.publicId);
}

async function deleteCloudinaryImages(images = []) {
  if (!cloudinaryConfigured) {
    if (images.length) throw new ApiError(503, "Cloudinary is not configured.");
    return;
  }
  const results = await Promise.allSettled(
    images.filter((image) => image.publicId).map((image) =>
      cloudinary.uploader.destroy(image.publicId, { resource_type: "image" })
    )
  );
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) throw new ApiError(502, "One or more images could not be deleted from Cloudinary.");
}

module.exports = { filesToImageRecords, deleteCloudinaryImages };
