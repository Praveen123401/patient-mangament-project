
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const c = require("../controllers/doctorController");

// Protect all doctor routes
router.use(protect);

// Get all doctors
router.get("/", c.getDoctors);

// Create doctor (admin or receptionist)
router.post("/", authorize("admin", "receptionist"), c.createDoctor);

// Get available doctor slots
router.get("/:id/slots", c.getAvailableSlots);

// Update availability
router.put(
  "/:id/availability",
  authorize("admin", "doctor", "receptionist"),
  c.setAvailability
);

// Get one doctor
router.get("/:id", c.getDoctor);

// Update doctor
router.put(
  "/:id",
  authorize("admin", "doctor"),
  c.updateDoctor
);

module.exports = router;
