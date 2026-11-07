const asyncHandler = require("express-async-handler");
const Bill = require("../models/Bill");
const generateId = require("../utils/generateId");
const { recalc } = require("../utils/billHelper");
const { getPagination, sendPaginated } = require("../utils/apiFeatures"); 
const PAYMENT_METHODS = require("../config/paymentMethods");
const { generateInvoicePDF } = require("../utils/generateInvoicePDF");
const { sendInvoiceByEmail } = require("../utils/emailService");

const find = async (id, res) => {
  const bill = await Bill.findById(id);
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  return bill;
};

// POST /api/billing   body: { patient, admission?, items: [{ description, amount, quantity }] }
exports.createBill = asyncHandler(async (req, res) => {
  const { patient, admission, items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    res.status(400);
    throw new Error("At least one bill item is required");
  }
  const bill = new Bill({
    billNo: await generateId(Bill, "BILL"),
    patient,
    admission,
    items,
    payments: [],
    createdBy: req.user.id,
  });
  recalc(bill);
  await bill.save();
  res.status(201).json({ success: true, data: bill });
});

// GET /api/billing?status=&patient=
exports.getBills = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  const [data, total] = await Promise.all([
    Bill.find(filter).populate("patient", "name patientId").sort("-createdAt").skip(pg.skip).limit(pg.limit),
    Bill.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate("patient", "name patientId phone email");
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  res.json({ success: true, data: bill });
});

// POST /api/billing/:id/email
exports.emailBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate("patient", "name patientId phone email");
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  if (!bill.patient?.email) {
    res.status(400);
    throw new Error("Add an email address to the patient record before emailing this invoice");
  }

  const invoice = {
    invoiceNumber: bill.billNo,
    createdAt: bill.createdAt,
    patientName: bill.patient.name,
    patientEmail: bill.patient.email,
    patientPhone: bill.patient.phone,
    items: bill.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      price: item.amount,
      amount: item.amount * item.quantity,
    })),
    subtotal: bill.totalAmount,
    discount: 0,
    tax: 0,
    totalAmount: bill.totalAmount,
    paymentStatus: bill.status.toUpperCase(),
    paymentMethod: bill.payments.at(-1)?.method,
  };
  const pdfBuffer = await generateInvoicePDF(invoice);

  try {
    await sendInvoiceByEmail(invoice, pdfBuffer);
  } catch (error) {
    res.status(502);
    throw new Error(`Unable to email invoice: ${error.message}`);
  }

  res.json({
    success: true,
    message: `Invoice sent to ${bill.patient.email}`,
  });
});

// POST /api/billing/:id/items   body: { description, amount, quantity }
exports.addItem = asyncHandler(async (req, res) => {
  const bill = await find(req.params.id, res);
  if (bill.status === "paid") {
    res.status(400);
    throw new Error("Bill is already fully paid");
  }
  bill.items.push(req.body);
  recalc(bill);
  await bill.save();
  res.json({ success: true, data: bill });
});

// POST /api/billing/:id/payments   body: { amount, method }
exports.addPayment = asyncHandler(async (req, res) => {
  const bill = await find(req.params.id, res);
  const amount = Number(req.body.amount);
  const balance = bill.totalAmount - bill.paidAmount;
  if (!(amount > 0)) {
    res.status(400);
    throw new Error("Payment amount must be greater than 0");
  }
  if (amount > balance) {
    res.status(400);
    throw new Error(`Payment exceeds the balance due (${balance})`);
  }
  bill.payments.push({ amount, method: req.body.method, receivedBy: req.user.id });
  recalc(bill);
  await bill.save();
  res.json({ success: true, data: bill });
});