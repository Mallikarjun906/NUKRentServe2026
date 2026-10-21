
const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const otpController = require("../controllers/otpController");
const controller = require("../controllers/authController");
const passwordResetController =
  require("../controllers/passwordResetController");

const { authenticate } = require("../middleware/authMiddleware");
const { validateBody } = require("../middleware/validateMiddleware");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later."
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again later."
  }
});

// Email OTP
router.post("/send-otp", otpLimiter, otpController.send);
router.post("/verify-otp", otpLimiter, otpController.verify);

// Authentication
router.post(
  "/register",
  validateBody(["name", "email", "phone", "password", "location"]),
  controller.register
);

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.post("/google", otpLimiter, controller.googleLogin);

// Password recovery
router.post(
  "/forgot-password",
  passwordResetLimiter,
  passwordResetController.forgotPassword
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  passwordResetController.resetPassword
);

module.exports = router;
