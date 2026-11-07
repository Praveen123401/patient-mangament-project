const express = require("express");
const router = express.Router();

const {
    createPatient,
    getPatients,
    getPatient,
    getPatientHistory,
    updatePatient,
    deletePatient
} = require("../controllers/patientcontroller");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", createPatient);
router.get("/", getPatients);
router.get("/:id/history", getPatientHistory);
router.get("/:id", getPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;