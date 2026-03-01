const createTransporter = require("../config/mailer");

const sendApplicationEmail = async ({ to, subject, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("SMTP is not configured. Skipping email:", { to, subject });
    return { sent: false, reason: "smtp_not_configured" };
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text
  });

  return { sent: true };
};

module.exports = sendApplicationEmail;
