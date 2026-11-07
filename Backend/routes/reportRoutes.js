const express = require("express");
const router = express.Router();
const { protect, authorize: authorizeRoles } = require("../middleware/authMiddleware");
const c = require("../controllers/reportController");

// reports show money and patient numbers, so they are admin only
router.use(protect, authorizeRoles("admin"));

router.get("/revenue", c.revenue);
router.get("/patients", c.patients);
router.get("/admissions", c.admissions);
router.get("/lab", c.lab);
router.get("/pharmacy", c.pharmacy);

module.exports = router;