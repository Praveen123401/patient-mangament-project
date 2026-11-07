const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const c = require("../controllers/dischargeController");

router.use(protect);
router.get("/", authorize("admin", "doctor", "nurse", "receptionist"), c.getDischarges);
router.get("/record/:id", authorize("admin", "doctor", "nurse", "receptionist"), c.getDischarge);
router.post("/:admissionId", authorize("admin", "doctor"), c.dischargePatient);

module.exports = router;