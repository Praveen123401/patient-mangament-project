const express = require("express");
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/me", getMyAttendance);
router.get("/", authorize("admin"), getAllAttendance);

module.exports = router;