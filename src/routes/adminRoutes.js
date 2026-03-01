const express = require("express");
const {
  getAllApplications,
  updateApplicationStatus
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/applications", authMiddleware, roleMiddleware("admin"), getAllApplications);
router.put("/application/:id/status", authMiddleware, roleMiddleware("admin"), updateApplicationStatus);

module.exports = router;
