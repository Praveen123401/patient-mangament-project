const asyncHandler = require("express-async-handler");
const Visitor = require("../models/Visitor");
const Admission = require("../models/Admission");
const { getPagination, sendPaginated, dayRange } = require("../utils/apiFeatures");

// POST /api/visitors/in   body: { visitorName, phone, patient, relation, purpose, idProof }
exports.visitorIn = asyncHandler(async (req, res) => {
  const admitted = await Admission.findOne({ patient: req.body.patient, status: "admitted" });
  if (!admitted) {
    res.status(400);
    throw new Error("Patient is not currently admitted");
  }
  const visitor = await Visitor.create({ ...req.body, inTime: new Date(), registeredBy: req.user.id });
  res.status(201).json({ success: true, data: visitor });
});

// PATCH /api/visitors/:id/out
exports.visitorOut = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);
  if (!visitor) {
    res.status(404);
    throw new Error("Visitor entry not found");
  }
  if (visitor.outTime) {
    res.status(400);
    throw new Error("Visitor already checked out");
  }
  visitor.outTime = new Date();
  await visitor.save();
  res.json({ success: true, data: visitor });
});

// GET /api/visitors?inside=true&date=&patient=
exports.getVisitors = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.inside === "true") filter.outTime = { $exists: false };
  if (req.query.date) filter.inTime = dayRange(req.query.date);
  if (req.query.patient) filter.patient = req.query.patient;
  const [data, total] = await Promise.all([
    Visitor.find(filter).populate("patient", "fullName patientId").sort("-inTime").skip(pg.skip).limit(pg.limit),
    Visitor.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id).populate("patient", "fullName patientId");
  if (!visitor) {
    res.status(404);
    throw new Error("Visitor entry not found");
  }
  res.json({ success: true, data: visitor });
});