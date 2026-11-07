
const express = require("express");
const {
  createInvoice,
  getInvoices,
  resendInvoiceEmail,
} = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin", "receptionist"));
router.post("/", createInvoice);
router.get("/", getInvoices);
router.post("/:id/resend-email", resendInvoiceEmail);

module.exports = router;
