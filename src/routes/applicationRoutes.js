const express = require("express");
const {
  applyForSmartId,
  getMyApplications
} = require("../controllers/applicationController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("student"), upload.single("proofFile"), asyncHandler(applyForSmartId));
router.post("/apply", authMiddleware, roleMiddleware("student"), upload.single("proofFile"), asyncHandler(applyForSmartId));
router.get("/my", authMiddleware, roleMiddleware("student"), asyncHandler(getMyApplications));

module.exports = router;
