const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    dob: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      default: "student",
      enum: ["student"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
