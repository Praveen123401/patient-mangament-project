
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const c = require("../controllers/appointmentController");

// Require login for all appointment routes
router.use(protect);

// Get all appointments
router.get(
  "/",
  authorize("admin", "doctor", "nurse", "receptionist"),
  c.getAppointments
);

// Book appointment
router.post(
  "/",
  authorize("admin", "receptionist"),
  c.bookAppointment
);

// Get appointment by ID
router.get(
  "/:id",
  authorize("admin", "doctor", "nurse", "receptionist"),
  c.getAppointment
);

// Reschedule appointment
router.patch(
  "/:id/reschedule",
  authorize("admin", "receptionist"),
  c.rescheduleAppointment
);

// Update appointment status
router.patch(
  "/:id/status",
  authorize("admin", "doctor", "nurse"),
  c.updateStatus
);

// Cancel appointment
router.patch(
  "/:id/cancel",
  authorize("admin", "receptionist"),
  c.cancelAppointment
);

module.exports = router;
