const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission" },
    symptoms: [String],
    diagnosis: String,
    vitals: {
      bp: String,
      pulse: Number,
      temperature: Number,
      spo2: Number,
      weight: Number,
      height: Number,
    },
    notes: String,
    attachments: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);