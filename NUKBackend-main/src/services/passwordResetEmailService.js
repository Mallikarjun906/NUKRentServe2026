 
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT || 587) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(email, resetUrl) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email SMTP credentials are missing.");
  }

  await transporter.sendMail({
    from: `"NUK RentServe" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your NUK RentServe password",
    text:
      `Reset your password using this link:\n${resetUrl}\n\n` +
      "This link expires in 15 minutes. Ignore this email if you did not request it.",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>NUK RentServe Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}"
             style="background:#b91c1c;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">
            Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes and can only be used once.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `
  });
}

module.exports = { sendPasswordResetEmail };
