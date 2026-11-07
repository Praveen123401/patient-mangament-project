const asyncHandler = require("express-async-handler");
const MedicalRecord = require("../models/MedicalRecord");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// the logged-in doctor, or body.doctor when an admin or nurse enters the record
const resolveDoctor = async (req) => {
  const me = await Doctor.findOne({ user: req.user.id });
  return me ? me._id : req.body.doctor;
};

const doctorPopulate = {
  path: "doctor",
  select: "specialization user",
  populate: { path: "user", select: "name" },
};

// POST /api/records
exports.createRecord = asyncHandler(async (req, res) => {
  const doctor = await resolveDoctor(req);
  if (!doctor) {
    res.status(400);
    throw new Error("Doctor is required");
  }
  if (!(await Patient.findOne({ _id: req.body.patient, isActive: true }))) {
    res.status(404);
    throw new Error("Patient not found");
  }
  const record = await MedicalRecord.create({ ...req.body, doctor });
  res.status(201).json({ success: true, data: record });
});

// GET /api/records/patient/:patientId
exports.getPatientRecords = asyncHandler(async (req, res) => {
  const data = await MedicalRecord.find({ patient: req.params.patientId })
    .populate(doctorPopulate)
    .sort("-createdAt");
  res.json({ success: true, count: data.length, data });
});

// GET /api/records/:id
exports.getRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate("patient", "name patientId age gender bloodGroup allergies")
    .populate(doctorPopulate);
  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }
  res.json({ success: true, data: record });
});

// PUT /api/records/:id  (the patient and doctor of a record cannot be changed)
exports.updateRecord = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  delete body.patient;
  delete body.doctor;
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }
  res.json({ success: true, data: record });
});