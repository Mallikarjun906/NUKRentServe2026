
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT || 587) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtp(email, otp) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in .env");
  }

  return transporter.sendMail({
    from: `"NUK RentServe" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "NUK RentServe Email Verification",
    text: `Your verification code is ${otp}. It expires in ${
      process.env.OTP_EXPIRY_MINUTES || 5
    } minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#b91c1c">NUK RentServe</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f3f4f6;padding:18px;text-align:center">
          ${String(otp).replace(/[&<>"']/g, "")}
        </div>
        <p>This code expires in ${
          Number(process.env.OTP_EXPIRY_MINUTES) || 5
        } minutes.</p>
        <p>Never share this code with anyone.</p>
      </div>
    `,
  });
}

async function verifyEmailConnection() {
  return transporter.verify();
}

module.exports = { sendOtp, verifyEmailConnection };
