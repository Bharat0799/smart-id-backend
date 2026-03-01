const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ user });
};

const updateProfile = async (req, res) => {
  const { name, idNumber, department, mobile, email, dob } = req.body;

  if (!name || !idNumber || !department || !mobile || !email || !dob) {
    return res.status(400).json({
      message: "name, idNumber, department, mobile, email and dob are required"
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const normalizedId = String(idNumber).trim().toLowerCase();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedDepartment = String(department).trim().toLowerCase();
  const normalizedMobile = String(mobile).trim();

  const existingById = await User.findOne({ idNumber: normalizedId, _id: { $ne: req.user.id } });
  if (existingById) {
    return res.status(409).json({ message: "ID Number already in use" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = String(name).trim();
  user.idNumber = normalizedId;
  user.department = normalizedDepartment;
  user.mobile = normalizedMobile;
  user.email = normalizedEmail;
  user.dob = String(dob).trim();

  const updatedUser = await user.save();
  const token = generateToken({
    id: updatedUser._id.toString(),
    role: "student",
    name: updatedUser.name,
    idNumber: updatedUser.idNumber,
    department: updatedUser.department
  });

  return res.status(200).json({
    message: "Profile updated successfully",
    token,
    user: {
      id: updatedUser._id,
      name: updatedUser.name,
      idNumber: updatedUser.idNumber,
      department: updatedUser.department,
      mobile: updatedUser.mobile || "",
      email: updatedUser.email || "",
      dob: updatedUser.dob,
      updatedAt: updatedUser.updatedAt
    }
  });
};

module.exports = {
  getProfile,
  updateProfile
};
