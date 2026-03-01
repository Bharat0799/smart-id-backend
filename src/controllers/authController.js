const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const BCRYPT_ROUNDS = 10;

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""));

const register = async (req, res) => {
  try {
    const { name, idNumber, department, dob, password, email, mobile } = req.body;

    if (!name || !idNumber || !department || !dob || !password) {
      return res.status(400).json({
        message: "name, idNumber, department, dob and password are required"
      });
    }

    const normalizedId = String(idNumber).toLowerCase().trim();
    const existingUser = await User.findOne({ idNumber: normalizedId });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const plainPassword = String(password);
    const hashedPassword = isBcryptHash(plainPassword)
      ? plainPassword
      : await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

    await User.create({
      name: String(name).trim(),
      idNumber: normalizedId,
      department: String(department).toLowerCase().trim(),
      email: String(email || "").toLowerCase().trim(),
      mobile: String(mobile || "").trim(),
      dob: String(dob).trim(),
      password: hashedPassword
    });

    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    return res.status(500).json({ message: "Failed to register", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { idNumber, email, password } = req.body;

    if ((!idNumber && !email) || !password) {
      return res.status(400).json({ message: "idNumber/email and password are required" });
    }

    // Admin login flow
    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (!admin) {
        console.log(`[LOGIN FAIL] admin_not_found email=${normalizedEmail}`);
        return res.status(401).json({ message: "Invalid ID or Password" });
      }

      const adminMatch = await bcrypt.compare(String(password), String(admin.password));
      if (!adminMatch) {
        console.log(`[LOGIN FAIL] admin_invalid_password email=${normalizedEmail}`);
        return res.status(401).json({ message: "Invalid ID or Password" });
      }

      console.log(`[LOGIN SUCCESS] admin email=${normalizedEmail} adminId=${admin._id.toString()}`);

      const token = generateToken({
        id: admin._id.toString(),
        role: "admin",
        email: admin.email
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: admin._id,
          email: admin.email,
          role: "admin"
        }
      });
    }

    const normalizedId = String(idNumber).toLowerCase().trim();
    let user = await User.findOne({ idNumber: normalizedId });
    let comparedHash = user ? String(user.password) : "";

    // Legacy compatibility: old seed data exists in Student with hashed DOB instead of User.password.
    if (!user) {
      const legacyStudent = await Student.findOne({ idNumber: normalizedId });
      if (!legacyStudent) {
        console.log(`[LOGIN FAIL] user_not_found idNumber=${normalizedId}`);
        return res.status(401).json({ message: "Invalid ID or Password" });
      }

      comparedHash = String(legacyStudent.dob);
      const legacyMatch = await bcrypt.compare(String(password), comparedHash);
      if (!legacyMatch) {
        console.log(`[LOGIN FAIL] invalid_password_legacy idNumber=${normalizedId}`);
        return res.status(401).json({ message: "Invalid ID or Password" });
      }

      user = await User.findOneAndUpdate(
        { idNumber: normalizedId },
        {
          name: legacyStudent.name,
          idNumber: legacyStudent.idNumber,
          department: legacyStudent.department,
          email: "",
          mobile: "",
          dob: legacyStudent.dob,
          password: legacyStudent.dob
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log(`[LOGIN MIGRATION] moved_legacy_student_to_user idNumber=${normalizedId}`);
    }

    const isMatch = await bcrypt.compare(String(password), comparedHash || String(user.password));
    if (!isMatch) {
      console.log(`[LOGIN FAIL] invalid_password idNumber=${normalizedId}`);
      return res.status(401).json({ message: "Invalid ID or Password" });
    }

    console.log(`[LOGIN SUCCESS] idNumber=${normalizedId} userId=${user._id.toString()}`);

    const token = generateToken({
      id: user._id.toString(),
      role: "student",
      name: user.name,
      idNumber: user.idNumber,
      department: user.department
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        idNumber: user.idNumber,
        department: user.department,
        email: user.email || "",
        mobile: user.mobile || "",
        dob: user.dob
      }
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return res.status(500).json({ message: "Failed to login", error: error.message });
  }
};

module.exports = { register, login };
