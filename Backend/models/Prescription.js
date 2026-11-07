const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalRecord" },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: String, // 500mg
        frequency: String, // 1-0-1
        duration: String, // 5 days
        instructions: String,
      },
    ],
    advice: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);