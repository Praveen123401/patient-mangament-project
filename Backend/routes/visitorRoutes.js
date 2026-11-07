const express = require("express");
const {
  getVisitors,
  getVisitor,
  visitorIn,
  visitorOut,
} = require("../controllers/visitorController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin", "receptionist", "nurse"));
router.get("/", getVisitors);
router.post("/in", visitorIn);
router.get("/:id", getVisitor);
router.patch("/:id/out", visitorOut);

module.exports = router;
