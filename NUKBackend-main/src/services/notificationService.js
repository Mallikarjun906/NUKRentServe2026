const { sendEmail } = require("./emailService");
async function notifyUser(user, subject, text) {
  if (!user?.email) return;
  try { await sendEmail({ to: user.email, subject, text }); }
  catch (error) { console.error("Notification delivery failed:", error.message); }
}
module.exports = { notifyUser };
