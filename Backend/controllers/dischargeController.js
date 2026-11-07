const asyncHandler = require("express-async-handler");
const Admission = require("../models/Admission");
const Discharge = require("../models/Discharge");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const calculateStay = require("../utils/calculateStay");
const notify = require("../utils/notify");
const { addToBill } = require("../utils/billHelper");
const { getPagination, sendPaginated } = require("../utils/apiFeatures");

// POST /api/discharge/:admissionId   (patient OUT)
// body: { condition, finalDiagnosis, treatmentGiven, summary, medicinesOnDischarge, followUpDate }
exports.dischargePatient = asyncHandler(async (req, res) => {
  const adm = await Admission.findById(req.params.admissionId).populate("doctor", "user");
  if (!adm) {
    res.status(404);
    throw new Error("Admission not found");
  }
  if (adm.status !== "admitted") {
    res.status(400);
    throw new Error("Patient is already discharged");
  }

  const now = new Date();

  // bed charges per ward stayed in (handles transfers between wards)
  const segments = [];
  let start = adm.admitDate;
  for (const t of adm.transfers) {
    segments.push({ ward: t.fromWard, from: start, to: t.date });
    start = t.date;
  }
  segments.push({ ward: adm.ward, from: start, to: now });

  // one bill line for each ward stayed in
  let bill;
  for (const seg of segments) {
    const ward = await Ward.findById(seg.ward);
    const days = calculateStay(seg.from, seg.to);
    bill = await addToBill({
      patient: adm.patient,
      admission: adm._id,
      description: `Bed charges - ${ward ? ward.name : "Ward"}`,
      amount: ward ? ward.chargePerDay : 0,
      quantity: days,
      createdBy: req.user.id,
    });
  }

  const discharge = await Discharge.create({
    admission: adm._id,
    patient: adm.patient,
    dischargeDate: now,
    condition: req.body.condition,
    finalDiagnosis: req.body.finalDiagnosis || adm.diagnosis,
    treatmentGiven: req.body.treatmentGiven,
    summary: req.body.summary,
    medicinesOnDischarge: req.body.medicinesOnDischarge,
    followUpDate: req.body.followUpDate,
    daysStayed: calculateStay(adm.admitDate, now),
    bill: bill._id,
    dischargedBy: req.user.id,
  });

  // close the admission and free the bed
  adm.status = "discharged";
  adm.dischargeDate = now;
  await adm.save();
  await Bed.findByIdAndUpdate(adm.bed, { status: "available", currentAdmission: null });

  notify(adm.doctor && adm.doctor.user, "Patient discharged", `Admission ${adm.admissionNo} discharged`, "discharge");
  res.status(201).json({ success: true, data: { discharge, bill } });
});

// GET /api/discharge?patient=&page=&limit=
exports.getDischarges = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.patient) filter.patient = req.query.patient;
  const [data, total] = await Promise.all([
    Discharge.find(filter)
      .populate("patient", "name patientId")
      .populate("admission", "admissionNo admitDate")
      .sort("-dischargeDate")
      .skip(pg.skip)
      .limit(pg.limit),
    Discharge.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

// GET /api/discharge/record/:id
exports.getDischarge = asyncHandler(async (req, res) => {
  const d = await Discharge.findById(req.params.id)
    .populate("patient")
    .populate("admission")
    .populate("bill");
  if (!d) {
    res.status(404);
    throw new Error("Discharge record not found");
  }
  res.json({ success: true, data: d });
});