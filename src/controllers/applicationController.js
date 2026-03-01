const fs = require("fs");

const Application = require("../models/Application");
const sendEmail = require("../utils/sendEmail");

const isNonEmpty = (value) => String(value || "").trim() !== "";

const applyForSmartId = async (req, res) => {
  try {
    const {
      name,
      idNumber,
      department,
      email,
      mobile,
      reason,
      correctionFields,
      corrections,
      transactionId,
      paymentStatus
    } = req.body;

    if (!isNonEmpty(name) || !isNonEmpty(idNumber) || !isNonEmpty(department) || !isNonEmpty(email) || !isNonEmpty(reason)) {
      return res.status(400).json({
        message: "name, idNumber, department, email and reason are required"
      });
    }

    if (!isNonEmpty(mobile)) {
      return res.status(400).json({
        message: "mobile is required"
      });
    }

    if (!isNonEmpty(transactionId)) {
      return res.status(400).json({
        message: "transactionId is required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "proof file is required"
      });
    }

    if (String(reason).trim() === "Correction") {
      const parsedFields = Array.isArray(correctionFields)
        ? correctionFields
        : (isNonEmpty(correctionFields) ? JSON.parse(correctionFields) : []);
      const parsedCorrections = corrections && typeof corrections === "object"
        ? corrections
        : (isNonEmpty(corrections) ? JSON.parse(corrections) : {});
      const selectedFields = Array.isArray(parsedFields) ? parsedFields.filter((field) => isNonEmpty(field)) : [];
      const correctionObject = parsedCorrections && typeof parsedCorrections === "object" ? parsedCorrections : {};

      if (selectedFields.length === 0) {
        return res.status(400).json({ message: "At least one correction field is required for Correction requests" });
      }

      const hasAllValues = selectedFields.every((field) => {
        const item = correctionObject[field];
        return item && isNonEmpty(item.new);
      });

      if (!hasAllValues) {
        return res.status(400).json({ message: "Please provide new values for all selected correction fields" });
      }
    }

    const normalizedCorrections = corrections && typeof corrections === "object"
      ? corrections
      : (isNonEmpty(corrections) ? JSON.parse(corrections) : {});
    const normalizedCorrectionFields = Array.isArray(correctionFields)
      ? correctionFields
      : (isNonEmpty(correctionFields) ? JSON.parse(correctionFields) : []);

    const normalizedIdNumber = String(idNumber).toLowerCase().trim();
    if (normalizedIdNumber !== String(req.user.idNumber || "").toLowerCase().trim()) {
      return res.status(403).json({ message: "You can only submit an application for your own ID" });
    }

    let proofFileData = "";
    if (req.file && req.file.path) {
      try {
        proofFileData = fs.readFileSync(req.file.path).toString("base64");
      } catch (fileError) {
        console.error("[PROOF FILE READ ERROR]", fileError.message || fileError);
      }
    }

    const application = await Application.create({
      userId: req.user.id,
      name: String(name).trim(),
      idNumber: normalizedIdNumber,
      department: String(department).toLowerCase().trim(),
      email: String(email).toLowerCase().trim(),
      mobile: String(mobile || "").trim(),
      reason: String(reason).trim(),
      correctionFields: Array.isArray(normalizedCorrectionFields) ? normalizedCorrectionFields : [],
      corrections: normalizedCorrections && typeof normalizedCorrections === "object" ? normalizedCorrections : {},
      proofFilePath: `/uploads/${req.file.filename}`,
      proofFileName: String(req.file.originalname || req.file.filename || "").trim(),
      proofFileData,
      transactionId: String(transactionId).trim(),
      paymentStatus: String(paymentStatus || "Paid").trim()
    });

    try {
      await sendEmail({
        applicationMongoId: application._id,
        to: application.email,
        subject: "Smart ID Application Submitted",
        title: "Application Submitted",
        studentName: application.name,
        message: "Your Smart ID application has been received successfully.",
        applicationId: application.applicationId,
        status: "Pending"
      });
    } catch (mailError) {
      // Do not fail application submission if SMTP is not configured.
      console.error("[APPLICATION EMAIL ERROR]", mailError.message || mailError);
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully"
    });
  } catch (error) {
    console.error("[APPLY ERROR]", error.message || error);
    return res.status(500).json({ message: "Failed to submit application" });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ applications });
  } catch (error) {
    console.error("[MY APPLICATIONS ERROR]", error.message || error);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};

module.exports = {
  applyForSmartId,
  getMyApplications
};
