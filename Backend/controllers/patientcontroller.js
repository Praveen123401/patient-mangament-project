// const asyncHandler = require("express-async-handler");
// const Patient = require("../models/Patient");
// const Appointment = require("../models/Appointment");
// const MedicalRecord = require("../models/MedicalRecord");
// const Prescription = require("../models/Prescription");
// const Admission = require("../models/Admission");
// const LabOrder = require("../models/LabOrder");
// const Bill = require("../models/Bill");
// const generateId = require("../utils/generateId");
// const { getPagination, searchRegex, sendPaginated } = require("../utils/apiFeatures");

// const normalizePatientBody = (body) => {
//   const normalized = { ...body };
//   normalized.fullName = body.fullName ?? body.name;
//   normalized.dateOfBirth = body.dateOfBirth ?? body.dob;
//   delete normalized.name;
//   delete normalized.dob;
//   delete normalized.age;
//   delete normalized.patientId;
//   return normalized;
// };

// // POST /api/patients
// exports.createPatient = asyncHandler(async (req, res) => {
//   const body = normalizePatientBody(req.body);
//   const patient = await Patient.create({
//     ...body,
//     patientId: await generateId(Patient, "PAT"),
//     createdBy: req.user.id,
//   });
//   res.status(201).json({ success: true, data: patient });
// });

// // GET /api/patients?search=&gender=&bloodGroup=&page=&limit=
// exports.getPatients = asyncHandler(async (req, res) => {
//   const pg = getPagination(req);
//   const filter = { isActive: true };
//   if (req.query.gender) filter.gender = req.query.gender;
//   if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
//   if (req.query.search) {
//     const r = searchRegex(req.query.search);
//     filter.$or = [{ fullName: r }, { patientId: r }, { phone: r }];
//   }
//   const [data, total] = await Promise.all([
//     Patient.find(filter).sort("-createdAt").skip(pg.skip).limit(pg.limit),
//     Patient.countDocuments(filter),
//   ]);
//   sendPaginated(res, data, total, pg);
// });

// exports.getPatient = asyncHandler(async (req, res) => {
//   const patient = await Patient.findOne({ _id: req.params.id, isActive: true });
//   if (!patient) {
//     res.status(404);
//     throw new Error("Patient not found");
//   }
//   res.json({ success: true, data: patient });
// });

// exports.updatePatient = asyncHandler(async (req, res) => {
//   const body = normalizePatientBody(req.body);
//   delete body.isActive;
//   const patient = await Patient.findByIdAndUpdate(req.params.id, body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!patient) {
//     res.status(404);
//     throw new Error("Patient not found");
//   }
//   res.json({ success: true, data: patient });
// });

// // DELETE /api/patients/:id  (soft delete)
// exports.deletePatient = asyncHandler(async (req, res) => {
//   const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
//   if (!patient) {
//     res.status(404);
//     throw new Error("Patient not found");
//   }
//   res.json({ success: true, message: "Patient removed" });
// });

// // GET /api/patients/:id/history  -> everything about one patient
// exports.getPatientHistory = asyncHandler(async (req, res) => {
//   const patient = await Patient.findById(req.params.id);
//   if (!patient) {
//     res.status(404);
//     throw new Error("Patient not found");
//   }
//   const p = { patient: patient._id };
//   const [appointments, records, prescriptions, admissions, labOrders, bills] = await Promise.all([
//     Appointment.find(p).populate({ path: "doctor", populate: { path: "user", select: "name" } }).sort("-date"),
//     MedicalRecord.find(p).sort("-createdAt"),
//     Prescription.find(p).sort("-createdAt"),
//     Admission.find(p).populate("ward bed").sort("-admitDate"),
//     LabOrder.find(p).populate("tests.test", "name category").sort("-createdAt"),
//     Bill.find(p).sort("-createdAt"),
//   ]);
//   res.json({
//     success: true,
//     data: { patient, appointments, records, prescriptions, admissions, labOrders, bills },
//   });
// }); 


const asyncHandler = require("express-async-handler");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const Admission = require("../models/Admission");
const LabOrder = require("../models/LabOrder");
const Bill = require("../models/Bill");
const generateId = require("../utils/generateId");
const { getPagination, searchRegex, sendPaginated } = require("../utils/apiFeatures");

// only these roles may see or change the sensitive fields
const FULL_ACCESS = ["admin", "receptionist"];
const RESTRICTED = ["aadhaarNumber", "rationCardNumber", "rationCardType", "annualIncome"];

const ALLOWED = [
  "name", "guardianName", "guardianRelation", "dob", "age", "gender", "maritalStatus", "occupation",
  "bloodGroup", "allergies", "phone", "alternatePhone", "email", "address", "city", "state", "pincode",
  "aadhaarNumber", "rationCardNumber", "rationCardType", "annualIncome", "emergencyContact",
];

// never sent to the list screen
const LIST_HIDE = RESTRICTED.map((f) => `-${f}`).join(" ");

const maskAadhaar = (n) => (n ? `XXXXXXXX${String(n).slice(-4)}` : n);

// what each role is allowed to see
const shape = (doc, role) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  if (!FULL_ACCESS.includes(role)) {
    p.aadhaarNumber = maskAadhaar(p.aadhaarNumber);
    delete p.rationCardNumber;
    delete p.rationCardType;
    delete p.annualIncome;
  }
  return p;
};

// clean the request: trim text, blank values are removed from the record
const prepare = (input, role) => {
  const body = { ...input };
  if (!FULL_ACCESS.includes(role)) RESTRICTED.forEach((k) => delete body[k]);

  const $set = {};
  const $unset = {};
  for (const k of ALLOWED) {
    if (!(k in body)) continue;
    let v = body[k];
    if (typeof v === "string") v = v.trim();
    if (k === "aadhaarNumber" && typeof v === "string") v = v.replace(/[\s-]/g, "");
    if (v === "" || v === null) $unset[k] = "";
    else $set[k] = v;
  }
  return { $set, $unset };
};

// POST /api/patients
exports.createPatient = asyncHandler(async (req, res) => {
  const { $set } = prepare(req.body, req.user.role);
  const patient = await Patient.create({
    ...$set,
    patientId: await generateId(Patient, "PAT"),
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: shape(patient, req.user.role) });
});

// GET /api/patients?search=&gender=&bloodGroup=&page=&limit=
exports.getPatients = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = { isActive: true };
  if (req.query.gender) filter.gender = req.query.gender;
  if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
  if (req.query.search) {
    const r = searchRegex(req.query.search);
    filter.$or = [{ name: r }, { patientId: r }, { phone: r }];
  }
  const [data, total] = await Promise.all([
    Patient.find(filter).select(LIST_HIDE).sort("-createdAt").skip(pg.skip).limit(pg.limit),
    Patient.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, isActive: true });
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  res.json({ success: true, data: shape(patient, req.user.role) });
});

// PUT /api/patients/:id
exports.updatePatient = asyncHandler(async (req, res) => {
  const { $set, $unset } = prepare(req.body, req.user.role);
  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;

  const patient = await Patient.findByIdAndUpdate(req.params.id, update, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  res.json({ success: true, data: shape(patient, req.user.role) });
});

// DELETE /api/patients/:id  (soft delete)
exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: "after" });
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  res.json({ success: true, message: "Patient removed" });
});

// GET /api/patients/:id/history
exports.getPatientHistory = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  const p = { patient: patient._id };
  const [appointments, records, prescriptions, admissions, labOrders, bills] = await Promise.all([
    Appointment.find(p).populate({ path: "doctor", populate: { path: "user", select: "name" } }).sort("-date"),
    MedicalRecord.find(p).sort("-createdAt"),
    Prescription.find(p).sort("-createdAt"),
    Admission.find(p).populate("ward bed").sort("-admitDate"),
    LabOrder.find(p).populate("tests.test", "name category").sort("-createdAt"),
    Bill.find(p).sort("-createdAt"),
  ]);
  res.json({
    success: true,
    data: {
      patient: shape(patient, req.user.role),
      appointments, records, prescriptions, admissions, labOrders, bills,
    },
  });
});