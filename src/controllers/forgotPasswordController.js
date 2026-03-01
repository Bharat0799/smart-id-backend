const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Student = require("../models/Student");
const BCRYPT_ROUNDS = 10;
const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ""));

const forgotPassword = async (req, res) => {
  try {
    const { idNumber, newPassword } = req.body;

    if (!idNumber || !newPassword) {
      return res.status(400).json({ message: "idNumber and newPassword are required" });
    }

    const normalizedId = String(idNumber).toLowerCase().trim();
    let user = await User.findOne({ idNumber: normalizedId });
    const legacyStudent = await Student.findOne({ idNumber: normalizedId });

    if (!user && !legacyStudent) {
      console.log(`[RESET FAIL] user_not_found idNumber=${normalizedId}`);
      return res.status(404).json({ message: "No account found for this ID." });
    }

    const incomingPassword = String(newPassword);
    const hashedPassword = isBcryptHash(incomingPassword)
      ? incomingPassword
      : await bcrypt.hash(incomingPassword, BCRYPT_ROUNDS);

    const oldUserHash = user ? String(user.password) : "";
    const oldLegacyHash = legacyStudent ? String(legacyStudent.dob) : "";

    if (!user && legacyStudent) {
      user = await User.findOneAndUpdate(
        { idNumber: normalizedId },
        {
          name: legacyStudent.name,
          idNumber: legacyStudent.idNumber,
          department: legacyStudent.department,
          dob: legacyStudent.dob,
          password: legacyStudent.dob
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`[RESET MIGRATION] moved_legacy_student_to_user idNumber=${normalizedId}`);
    }

    console.log(`[RESET START] idNumber=${normalizedId} userId=${user._id.toString()}`);
    user.password = hashedPassword;
    await user.save();

    if (legacyStudent) {
      legacyStudent.dob = hashedPassword;
      await legacyStudent.save();
    }

    const updatedUser = await User.findOne({ idNumber: normalizedId });
    const updatedHash = updatedUser ? String(updatedUser.password) : "";
    const updatedLegacyStudent = legacyStudent ? await Student.findOne({ idNumber: normalizedId }) : null;
    const updatedLegacyHash = updatedLegacyStudent ? String(updatedLegacyStudent.dob) : "";
    const userChanged = oldUserHash !== updatedHash;
    const legacyChanged = legacyStudent ? oldLegacyHash !== updatedLegacyHash : true;
    const changed = userChanged && legacyChanged;

    console.log(
      `[RESET RESULT] idNumber=${normalizedId} changed=${changed} userChanged=${userChanged} legacyChanged=${legacyChanged} newHashPrefix=${updatedHash.slice(0, 7)}`
    );

    if (!changed) {
      return res.status(500).json({ message: "Password reset failed to persist in database." });
    }

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("[RESET ERROR]", error);
    return res.status(500).json({
      message: "Failed to reset password",
      error: error.message
    });
  }
};

module.exports = { forgotPassword };
