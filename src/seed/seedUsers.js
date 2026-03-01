require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

const fixedStudents = [
  { name: "sai", idNumber: "cse001", dob: "07082006", department: "cse" },
  { name: "ram", idNumber: "cse002", dob: "15092006", department: "cse" },
  { name: "venkat", idNumber: "ece001", dob: "02032006", department: "ece" },
  { name: "srikanth", idNumber: "mech001", dob: "11012006", department: "mech" },
  { name: "reddy", idNumber: "ece002", dob: "25072006", department: "ece" }
];

const seedUsers = async () => {
  await connectDB();

  for (const student of fixedStudents) {
    const hashedDob = await bcrypt.hash(student.dob, 10);

    await Student.findOneAndUpdate(
      { idNumber: student.idNumber },
      {
        name: student.name,
        idNumber: student.idNumber,
        dob: hashedDob,
        department: student.department,
        role: "student"
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  await Admin.findOneAndUpdate(
    { email: "admin@smartid.com" },
    {
      email: "admin@smartid.com",
      password: hashedAdminPassword,
      role: "admin"
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log("Seed complete: 5 students and 1 admin ensured.");
  process.exit(0);
};

seedUsers().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
