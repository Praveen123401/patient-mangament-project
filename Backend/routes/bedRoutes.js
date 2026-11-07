const express = require("express");
const router = express.Router();
const { protect, authorize: authorizeRoles } = require("../middleware/authMiddleware");
const c = require("../controllers/bedController");

router.use(protect, authorizeRoles("admin", "doctor", "nurse", "receptionist"));
router.route("/").get(c.getBeds).post(authorizeRoles("admin"), c.createBed);
router.get("/available", c.getAvailableBeds); // keep above the ":id" routes
router.patch("/:id/status", authorizeRoles("admin", "nurse"), c.updateBedStatus);
router.delete("/:id", authorizeRoles("admin"), c.deleteBed);

module.exports = router;