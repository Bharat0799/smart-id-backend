const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true
  },
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["Sent", "Failed"],
    required: true
  },
  errorMessage: {
    type: String,
    default: ""
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("EmailLog", emailLogSchema);
