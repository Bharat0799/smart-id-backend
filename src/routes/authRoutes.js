const express = require("express");
const { register, login } = require("../controllers/authController");
const { forgotPassword } = require("../controllers/forgotPasswordController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));

module.exports = router;
