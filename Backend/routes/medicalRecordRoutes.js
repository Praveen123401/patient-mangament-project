const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const c = require("../controllers/medicalRecordController");

// medical records are clinical data: admin, doctors and nurses only
router.use(protect, authorize("admin", "doctor", "nurse"));

router.post("/", c.createRecord);
router.get("/patient/:patientId", c.getPatientRecords); // keep above "/:id"
router.route("/:id").get(c.getRecord).put(c.updateRecord);

module.exports = router;