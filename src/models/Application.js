const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    idNumber: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      default: "",
      trim: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    correctionFields: {
      type: [String],
      default: []
    },
    corrections: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    proofFilePath: {
      type: String,
      default: ""
    },
    proofFileName: {
      type: String,
      default: "",
      trim: true
    },
    proofFileData: {
      type: String,
      default: ""
    },
    transactionId: {
      type: String,
      default: "",
      trim: true
    },
    paymentStatus: {
      type: String,
      default: "Unpaid",
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Printing", "Ready", "Completed"],
      default: "Pending"
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    printedAt: {
      type: Date,
      default: null
    },
    readyAt: {
      type: Date,
      default: null
    },
    collectFrom: {
      type: Date,
      default: null
    },
    collectTo: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    remarks: {
      type: String,
      default: "",
      trim: true
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

applicationSchema.pre("validate", async function setApplicationId(next) {
  if (this.applicationId) {
    return next();
  }

  const count = await this.constructor.countDocuments();
  this.applicationId = `APP-${String(count + 1).padStart(4, "0")}`;
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
