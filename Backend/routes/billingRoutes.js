const express = require("express");
const {
  createBill,
  getBills,
  getBill,
  emailBill,
  addItem,
  addPayment,
} = require("../controllers/billingController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin", "receptionist"));
router.route("/")
  .get(getBills)
  .post(createBill);
router.post("/:id/email", emailBill);
router.get("/:id", getBill);
router.post("/:id/items", addItem);
router.post("/:id/payments", addPayment);

module.exports = router;
