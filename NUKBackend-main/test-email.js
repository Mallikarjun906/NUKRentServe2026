require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function test() {
  await transporter.verify();
  console.log("SUCCESS: Gmail SMTP connection works.");
}

test().catch((error) => {
  console.error("SMTP ERROR:", error.code, error.message);
});