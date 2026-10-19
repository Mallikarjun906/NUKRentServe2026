
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:5502",
  "http://localhost:5502",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  ...(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header are allowed.
      if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Health checks
app.get("/health", (req, res) =>
  res.json({ success: true, message: "NUK RentServe API is running." })
);

app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "NUK RentServe API is running." })
);

app.get("/api/v1/health", (req, res) =>
  res.json({ success: true, message: "NUK RentServe API is running." })
);

// Authentication
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));

// Users
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));

// Service providers
app.use("/api/providers", require("./routes/providerRoutes"));
app.use("/api/v1/providers", require("./routes/providerRoutes"));

// Categories
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/v1/categories", require("./routes/categoryRoutes"));

// Services
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/v1/services", require("./routes/serviceCompatRoutes"));
app.use("/api/v1/services", require("./routes/serviceRoutes"));

// Jobs
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/v1/jobs", require("./routes/jobRoutes"));

// Applications
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/v1/applications", require("./routes/applicationRoutes"));

// Properties
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/v1/properties", require("./routes/propertyCompatRoutes"));
app.use("/api/v1/properties", require("./routes/propertyRoutes"));

// Enquiries
app.use("/api/enquiries", require("./routes/enquiryRoutes"));
app.use("/api/v1/enquiries", require("./routes/enquiryRoutes"));

// Reviews
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/v1/reviews", require("./routes/reviewRoutes"));

// Admin
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));

// Bookings
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/v1/bookings", require("./routes/bookingRoutes"));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
