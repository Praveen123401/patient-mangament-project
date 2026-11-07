const express = require("express");
const router = express.Router();
const { protect, authorize: authorizeRoles } = require("../middleware/authMiddleware");
const c = require("../controllers/wardController");

const STAFF = ["admin", "doctor", "nurse", "receptionist"];

router.use(protect);
router.route("/").get(authorizeRoles(...STAFF), c.getWards).post(authorizeRoles("admin"), c.createWard);
router
  .route("/:id")
  .get(authorizeRoles(...STAFF), c.getWard)
  .put(authorizeRoles("admin"), c.updateWard)
  .delete(authorizeRoles("admin"), c.deleteWard);

module.exports = router;