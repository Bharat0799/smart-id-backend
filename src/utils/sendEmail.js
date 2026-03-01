const { Resend } = require("resend");
const EmailLog = require("../models/EmailLog");
const { generateEmailTemplate } = require("./emailTemplate");

const resend = new Resend(process.env.RESEND_API_KEY);

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
  try {
    const html = generateEmailTemplate({
      title,
      studentName,
      message,
      applicationId,
      status,
      collectFrom,
      collectTo
    });

    await resend.emails.send({
      from: "Smart ID <onboarding@resend.dev>",
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
    await EmailLog.create({
      applicationId: applicationMongoId,
      to,
      subject,
      status: "Failed",
      errorMessage: error.message,
      sentAt: new Date()
    });

    return { sent: false, error: error.message };
  }
};

module.exports = sendEmail;
