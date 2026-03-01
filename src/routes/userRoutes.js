const express = require("express");

const { getProfile, updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/profile", authMiddleware, roleMiddleware("student"), asyncHandler(getProfile));
router.put("/profile", authMiddleware, roleMiddleware("student"), asyncHandler(updateProfile));

module.exports = router;
