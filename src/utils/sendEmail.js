const nodemailer = require("nodemailer");

const EmailLog = require("../models/EmailLog");
const { generateEmailTemplate } = require("./emailTemplate");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user,
    pass
  }
});
};

const sendEmail = async ({
  applicationMongoId,
  applicationId,
  to,
  subject,
  title,
  studentName,
  message,
  status,
  collectFrom,
  collectTo
}) => {
  const transporter = createTransporter();
  if (!transporter) {
    await EmailLog.create({
      applicationId: applicationMongoId,
      to,
      subject,
      status: "Failed",
      errorMessage: "Gmail SMTP is not configured",
      sentAt: new Date()
    });
    return { sent: false, error: "smtp_not_configured" };
  }

  const html = generateEmailTemplate({
    title,
    studentName,
    message,
    applicationId,
    status,
    collectFrom,
    collectTo
  });

  const from = process.env.MAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        html
      });

      await EmailLog.create({
        applicationId: applicationMongoId,
        to,
        subject,
        status: "Sent",
        sentAt: new Date()
      });

      return { sent: true };
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await delay(2000);
      }
    }
  }

  await EmailLog.create({
    applicationId: applicationMongoId,
    to,
    subject,
    status: "Failed",
    errorMessage: lastError ? String(lastError.message || lastError) : "Unknown email error",
    sentAt: new Date()
  });

  return { sent: false, error: lastError ? String(lastError.message || lastError) : "unknown_error" };
};

module.exports = sendEmail;
