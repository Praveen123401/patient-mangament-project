const express = require("express");
const {
  admitPatient,
  getAdmissions,
  getAdmission,
  transferBed,
} = require("../controllers/admissionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.route("/").get(getAdmissions).post(admitPatient);
router.get("/:id", getAdmission);
router.patch("/:id/transfer", transferBed);

module.exports = router;
