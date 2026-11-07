const mongoose = require("mongoose");

const dischargeSchema = new mongoose.Schema(
  {
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    dischargeDate: { type: Date, default: Date.now },
    condition: {
      type: String,
      enum: ["recovered", "improved", "referred", "lama", "deceased"],
      default: "recovered",
    },
    finalDiagnosis: String,
    treatmentGiven: String,
    summary: String,
    medicinesOnDischarge: [{ name: String, dosage: String, frequency: String, duration: String }],
    followUpDate: Date,
    daysStayed: Number,
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discharge", dischargeSchema);