const asyncHandler = require("express-async-handler");
const LabTest = require("../models/LabTest");
const LabOrder = require("../models/LabOrder");
const Doctor = require("../models/Doctor");
const generateId = require("../utils/generateId");
const flagResult = require("../utils/flagResult");
const notify = require("../utils/notify");
const { addToBill } = require("../utils/billHelper");
const { getPagination, searchRegex, sendPaginated } = require("../utils/apiFeatures");

const notFound = (res, what) => {
  res.status(404);
  throw new Error(`${what} not found`);
};

/* ---------- Test catalog (blood, urine, hormone ...) ---------- */

exports.createTest = asyncHandler(async (req, res) => {
  const test = await LabTest.create(req.body);
  res.status(201).json({ success: true, data: test });
});

// GET /api/lab/tests?category=blood&search=
exports.getTests = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = searchRegex(req.query.search);
  const data = await LabTest.find(filter).sort("category name");
  res.json({ success: true, count: data.length, data });
});

exports.updateTest = asyncHandler(async (req, res) => {
  const test = await LabTest.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true });
  if (!test) notFound(res, "Test");
  res.json({ success: true, data: test });
});

exports.deleteTest = asyncHandler(async (req, res) => {
  const test = await LabTest.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: "after" });
  if (!test) notFound(res, "Test");
  res.json({ success: true, message: "Test deactivated" });
});

/* ---------- Orders ---------- */

// POST /api/lab/orders   body: { patient, admission?, tests: [testId], priority }
exports.createOrder = asyncHandler(async (req, res) => {
  const { patient, admission, tests, priority } = req.body;
  if (!Array.isArray(tests) || !tests.length) {
    res.status(400);
    throw new Error("Select at least one test");
  }
  const found = await LabTest.find({ _id: { $in: tests }, isActive: true });
  if (found.length !== new Set(tests.map(String)).size) {
    res.status(400);
    throw new Error("One or more tests are invalid");
  }
  const me = await Doctor.findOne({ user: req.user._id });

  const order = await LabOrder.create({
    orderNo: await generateId(LabOrder, "LAB"),
    patient,
    admission,
    doctor: me ? me._id : req.body.doctor,
    tests: found.map((t) => ({ test: t._id })),
    priority,
    totalAmount: found.reduce((s, t) => s + t.price, 0),
    orderedBy: req.user._id,
  });

  // lab charges go straight to the patient's bill
  for (const t of found) {
    await addToBill({
      patient,
      admission,
      description: `Lab - ${t.name}`,
      amount: t.price,
      createdBy: req.user._id,
    });
  }
  res.status(201).json({ success: true, data: order });
});

// GET /api/lab/orders?status=&patient=&priority=
exports.getOrders = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  ["status", "patient", "priority"].forEach((k) => req.query[k] && (filter[k] = req.query[k]));
  const [data, total] = await Promise.all([
    LabOrder.find(filter)
      .populate("patient", "fullName patientId")
      .populate("tests.test", "name category")
      .sort({ priority: -1, createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit),
    LabOrder.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await LabOrder.findById(req.params.id)
    .populate("patient", "fullName patientId dateOfBirth gender")
    .populate("tests.test");
  if (!order) notFound(res, "Lab order");
  res.json({ success: true, data: order });
});

// GET /api/lab/orders/patient/:patientId
exports.getPatientLabHistory = asyncHandler(async (req, res) => {
  const data = await LabOrder.find({ patient: req.params.patientId })
    .populate("tests.test", "name category unit normalRange")
    .sort("-createdAt");
  res.json({ success: true, count: data.length, data });
});

/* ---------- Sample -> results -> verify ---------- */

// PATCH /api/lab/orders/:id/collect
exports.collectSample = asyncHandler(async (req, res) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) notFound(res, "Lab order");
  if (order.status !== "ordered") {
    res.status(400);
    throw new Error(`Sample cannot be collected - order is ${order.status}`);
  }
  order.status = "collected";
  order.sampleCollectedAt = new Date();
  order.collectedBy = req.user._id;
  await order.save();
  res.json({ success: true, data: order });
});

// PUT /api/lab/orders/:id/results   body: { results: [{ test, value, remarks }] }
exports.enterResults = asyncHandler(async (req, res) => {
  const order = await LabOrder.findById(req.params.id).populate("tests.test");
  if (!order) notFound(res, "Lab order");
  if (!["collected", "processing"].includes(order.status)) {
    res.status(400);
    throw new Error("Collect the sample before entering results");
  }
  const { results } = req.body;
  if (!Array.isArray(results) || !results.length) {
    res.status(400);
    throw new Error("results array is required");
  }
  for (const r of results) {
    const item = order.tests.find((t) => String(t.test._id) === String(r.test));
    if (!item) continue;
    item.value = String(r.value);
    item.unit = item.test.unit;
    item.remarks = r.remarks;
    item.flag = flagResult(r.value, item.test);
  }
  order.status = "processing";
  order.enteredBy = req.user._id;
  await order.save();
  res.json({ success: true, data: order });
});

// PATCH /api/lab/orders/:id/verify   (pathologist / admin)
exports.verifyOrder = asyncHandler(async (req, res) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) notFound(res, "Lab order");
  if (order.status !== "processing") {
    res.status(400);
    throw new Error("Only orders with entered results can be verified");
  }
  if (order.tests.some((t) => t.value == null || t.value === "")) {
    res.status(400);
    throw new Error("Enter results for all tests first");
  }
  order.status = "completed";
  order.verifiedBy = req.user._id;
  order.completedAt = new Date();
  await order.save();

  const critical = order.tests.some((t) => t.flag === "critical");
  notify(
    order.orderedBy,
    critical ? "CRITICAL lab result" : "Lab results ready",
    `Order ${order.orderNo} is complete`,
    "lab"
  );
  res.json({ success: true, data: order });
});

// PATCH /api/lab/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) notFound(res, "Lab order");
  if (["processing", "completed"].includes(order.status)) {
    res.status(400);
    throw new Error("Order can no longer be cancelled");
  }
  order.status = "cancelled";
  await order.save();
  res.json({ success: true, data: order });
});