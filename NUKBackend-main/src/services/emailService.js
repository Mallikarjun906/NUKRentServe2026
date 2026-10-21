
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendBrevoEmail({ to, subject, textContent, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;
  const senderName = process.env.EMAIL_FROM_NAME || "NUK RentServe";

  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY or EMAIL_FROM is missing.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      textContent,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Brevo API error:", response.status, details);
    throw new Error(`Brevo email request failed (${response.status}).`);
  }

  return response.json();
}

async function sendOtp(email, otp) {
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
  const safeOtp = String(otp).replace(/[&<>"']/g, "");

  return sendBrevoEmail({
    to: email,
    subject: "NUK RentServe Email Verification",
    textContent:
      `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes. ` +
      "Do not share this code with anyone.",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#b91c1c">NUK RentServe</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f3f4f6;padding:18px;text-align:center">
          ${safeOtp}
        </div>
        <p>This code expires in ${expiryMinutes} minutes.</p>
        <p>Never share this code with anyone.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  return sendBrevoEmail({
    to: email,
    subject: "Reset your NUK RentServe password",
    textContent:
      `Reset your password using this link:\n${resetUrl}\n\n` +
      "This link expires in 15 minutes. Ignore this email if you did not request it.",
    htmlContent: `
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
    `,
  });
}

// Retained for compatibility with any existing imports.
// Brevo is verified by the API response when an email is sent.
async function verifyEmailConnection() {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Brevo email configuration is missing.");
  }
  return true;
}

module.exports = {
  sendOtp,
  sendPasswordResetEmail,
  verifyEmailConnection,
};
