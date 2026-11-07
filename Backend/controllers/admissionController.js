const asyncHandler = require("express-async-handler");
const Admission = require("../models/Admission");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Bed = require("../models/Bed");
const generateId = require("../utils/generateId");
const notify = require("../utils/notify");
const { getPagination, sendPaginated } = require("../utils/apiFeatures");

const populateAdm = (q) =>
  q
    .populate("patient", "fullName patientId phone")
    .populate("ward", "name type chargePerDay")
    .populate("bed", "bedNumber status")
    .populate({ path: "doctor", select: "specialization user", populate: { path: "user", select: "name" } });

// Atomically claim a bed so two admissions can't take the same one
const claimBed = (bedId) =>
  Bed.findOneAndUpdate(
    { _id: bedId, status: "available", isActive: true },
    { status: "occupied" },
    { returnDocument: "after" }
  );

// POST /api/admissions   (patient IN)   body: { patient, doctor, bed, reason, diagnosis }
exports.admitPatient = asyncHandler(async (req, res) => {
  const { patient, doctor, bed, reason, diagnosis } = req.body;

  const [p, d] = await Promise.all([Patient.findById(patient), Doctor.findById(doctor)]);
  if (!p || !d) {
    res.status(404);
    throw new Error("Patient or doctor not found");
  }
  if (await Admission.findOne({ patient, status: "admitted" })) {
    res.status(409);
    throw new Error("Patient is already admitted");
  }
  const bedDoc = await claimBed(bed);
  if (!bedDoc) {
    res.status(400);
    throw new Error("Bed is not available");
  }

  let admission;
  try {
    admission = await Admission.create({
      admissionNo: await generateId(Admission, "ADM"),
      patient,
      doctor,
      ward: bedDoc.ward,
      bed: bedDoc._id,
      reason,
      diagnosis,
      admittedBy: req.user._id,
    });
  } catch (err) {
    await Bed.findByIdAndUpdate(bedDoc._id, { status: "available", currentAdmission: null });
    throw err;
  }
  bedDoc.currentAdmission = admission._id;
  await bedDoc.save();

  notify(d.user, "New admission", `${p.name} admitted - bed ${bedDoc.bedNumber}`, "admission");
  res.status(201).json({ success: true, data: admission });
});

// GET /api/admissions?status=admitted&ward=&doctor=
exports.getAdmissions = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.ward) filter.ward = req.query.ward;
  if (req.query.doctor) filter.doctor = req.query.doctor;
  if (req.query.patient) filter.patient = req.query.patient;
  const [data, total] = await Promise.all([
    populateAdm(Admission.find(filter)).sort("-admitDate").skip(pg.skip).limit(pg.limit),
    Admission.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getAdmission = asyncHandler(async (req, res) => {
  const adm = await populateAdm(Admission.findById(req.params.id));
  if (!adm) {
    res.status(404);
    throw new Error("Admission not found");
  }
  res.json({ success: true, data: adm });
});

// PATCH /api/admissions/:id/transfer   body: { newBed, reason }
exports.transferBed = asyncHandler(async (req, res) => {
  const adm = await Admission.findById(req.params.id);
  if (!adm || adm.status !== "admitted") {
    res.status(400);
    throw new Error("Only currently admitted patients can be transferred");
  }
  if (String(adm.bed) === String(req.body.newBed)) {
    res.status(400);
    throw new Error("Patient is already in this bed");
  }
  const newBed = await claimBed(req.body.newBed);
  if (!newBed) {
    res.status(400);
    throw new Error("New bed is not available");
  }
  // free the old bed
  await Bed.findByIdAndUpdate(adm.bed, { status: "available", currentAdmission: null });

  adm.transfers.push({
    fromBed: adm.bed,
    toBed: newBed._id,
    fromWard: adm.ward,
    toWard: newBed.ward,
    reason: req.body.reason,
  });
  adm.bed = newBed._id;
  adm.ward = newBed.ward;
  await adm.save();

  newBed.currentAdmission = adm._id;
  await newBed.save();
  res.json({ success: true, data: adm });
});