
const EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendPasswordResetEmail(email, resetUrl) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;
  const senderName = process.env.EMAIL_FROM_NAME || "NUK RentServe";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo email configuration is missing. Check BREVO_API_KEY and EMAIL_FROM."
    );
  }

  const html = `
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
  `;

  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [{ email }],
      subject: "Reset your NUK RentServe password",
      textContent:
        `Reset your password using this link:\n${resetUrl}\n\n` +
        "This link expires in 15 minutes. Ignore this email if you did not request it.",
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Brevo password-reset email failed:", response.status, errorText);
    throw new Error(`Brevo email API failed with status ${response.status}.`);
  }
}

module.exports = { sendPasswordResetEmail };
