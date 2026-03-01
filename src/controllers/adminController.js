const mongoose = require("mongoose");

const Application = require("../models/Application");
const sendEmail = require("../utils/sendEmail");

const ALLOWED_STATUSES = ["Pending", "Approved", "Rejected", "Printing", "Ready", "Completed"];
const NEXT_ALLOWED_STATUSES = {
  Pending: ["Approved", "Rejected"],
  Approved: ["Printing"],
  Printing: ["Ready"],
  Ready: ["Completed"],
  Rejected: [],
  Completed: []
};
const normalizeLegacyStatus = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "submitted" || normalized === "review") return "Pending";
  return String(value || "Pending");
};

const getAllApplications = async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (date) {
      const start = new Date(String(date));
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid date filter. Use YYYY-MM-DD." });
      }
      const end = new Date(String(date));
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const applications = await Application.find(query)
      .populate("userId", "name idNumber department")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("[ADMIN APPLICATIONS ERROR]", error.message || error);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status === "Rejected" && !String(remarks || "").trim()) {
      return res.status(400).json({ message: "Remarks are required when status is Rejected" });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { applicationId: id }] }
      : { applicationId: id };

    const application = await Application.findOne(query);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const currentStatus = normalizeLegacyStatus(application.status);
    if (currentStatus !== application.status) {
      application.status = currentStatus;
    }
    const allowedNext = NEXT_ALLOWED_STATUSES[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${currentStatus} -> ${status}`
      });
    }

    application.status = status;
    application.remarks = String(remarks || "").trim();
    const now = new Date();

    if (status === "Approved" && !application.reviewedAt) {
      application.reviewedAt = now;
    }

    if (status === "Printing") {
      if (!application.reviewedAt) {
        application.reviewedAt = now;
      }
      application.printedAt = now;
    }

    if (status === "Ready") {
      if (!application.reviewedAt) {
        application.reviewedAt = now;
      }
      if (!application.printedAt) {
        application.printedAt = now;
      }
      application.readyAt = now;
      application.collectFrom = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      application.collectTo = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    if (status === "Completed") {
      if (!application.reviewedAt) {
        application.reviewedAt = now;
      }
      if (!application.printedAt) {
        application.printedAt = now;
      }
      if (!application.readyAt) {
        application.readyAt = now;
      }
      if (!application.collectFrom) {
        application.collectFrom = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      }
      if (!application.collectTo) {
        application.collectTo = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      }
      application.completedAt = now;
    }

    await application.save();

    if (["Approved", "Rejected", "Printing", "Ready", "Completed"].includes(status)) {
      let text = `Your Smart ID application (${application.applicationId}) status is now ${status}.`;

      if (status === "Rejected") {
        text = `Your Smart ID application (${application.applicationId}) was rejected. Remarks: ${application.remarks || "N/A"}`;
      }

      try {
        await sendEmail({
          applicationMongoId: application._id,
          to: application.email,
          subject: `Application ${status}`,
          title: `Application ${status}`,
          studentName: application.name,
          message: text,
          applicationId: application.applicationId,
          status,
          collectFrom: application.collectFrom,
          collectTo: application.collectTo
        });
      } catch (mailError) {
        // Status change should succeed even if SMTP is not configured.
        console.error("[STATUS EMAIL ERROR]", mailError.message || mailError);
      }
    }

    return res.status(200).json({ message: "Application status updated", application });
  } catch (error) {
    console.error("[ADMIN STATUS UPDATE ERROR]", error.message || error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

module.exports = {
  getAllApplications,
  updateApplicationStatus
};
