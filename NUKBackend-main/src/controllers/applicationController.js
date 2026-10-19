const mongoose = require("mongoose");
const JobApplication = require("../models/JobApplication");
const ServiceListing = require("../models/ServiceListing");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { notifyUser } = require("../services/notificationService");

const applyToJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) throw new ApiError(400, "Invalid job ID.");
  const job = await ServiceListing.findOne({ _id: jobId, listingType: "job", status: "published", availability: true });
  if (!job) throw new ApiError(404, "Available job not found.");
  if (job.providerId.toString() === req.user.id) throw new ApiError(400, "You cannot apply to your own job.");
  const application = await JobApplication.create({ jobId, studentId: req.user.id, coverMessage: req.body.coverMessage || "" });
  const owner = await User.findById(job.providerId);
  await notifyUser(owner, "New job application", `${req.user.name} applied for: ${job.title}`);
  res.status(201).json(new ApiResponse(201, application, "Application submitted."));
});

const myApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { studentId: req.user.id };
  const [items, total] = await Promise.all([
    JobApplication.find(filter).populate("jobId", "title location priceRange payUnit status providerId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    JobApplication.countDocuments(filter)
  ]);
  res.json(new ApiResponse(200, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
});

const applicationsForJob = asyncHandler(async (req, res) => {
  const job = await ServiceListing.findById(req.params.id);
  if (!job || job.listingType !== "job") throw new ApiError(404, "Job not found.");
  if (job.providerId.toString() !== req.user.id && req.user.role !== "admin") throw new ApiError(403, "You cannot view applicants for this job.");
  const items = await JobApplication.find({ jobId: job._id }).populate("studentId", "name email phone location").sort({ createdAt: -1 });
  res.json(new ApiResponse(200, items));
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const allowed = ["shortlisted", "accepted", "rejected"];
  if (!allowed.includes(req.body.status)) throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  const application = await JobApplication.findById(req.params.id).populate("jobId");
  if (!application) throw new ApiError(404, "Application not found.");
  if (req.user.role !== "admin" && application.jobId.providerId.toString() !== req.user.id) throw new ApiError(403, "You cannot update this application.");
  if (application.status === "withdrawn") throw new ApiError(400, "Withdrawn applications cannot be changed.");
  application.status = req.body.status;
  if (typeof req.body.ownerNote === "string") application.ownerNote = req.body.ownerNote.slice(0, 1000);
  await application.save();
  const student = await User.findById(application.studentId);
  await notifyUser(student, "Application status updated", `Your application for ${application.jobId.title} is now ${application.status}.`);
  res.json(new ApiResponse(200, application, "Application status updated."));
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, studentId: req.user.id });
  if (!application) throw new ApiError(404, "Application not found.");
  if (["accepted", "rejected"].includes(application.status)) throw new ApiError(400, "This application can no longer be withdrawn.");
  application.status = "withdrawn";
  await application.save();
  res.json(new ApiResponse(200, application, "Application withdrawn."));
});

module.exports = { applyToJob, myApplications, applicationsForJob, updateApplicationStatus, withdrawApplication };
