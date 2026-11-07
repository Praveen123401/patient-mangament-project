const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    admissionNo: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: "Ward", required: true },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },
    reason: { type: String, required: true },
    diagnosis: String,
    admitDate: { type: Date, default: Date.now },
    dischargeDate: Date,
    status: { type: String, enum: ["admitted", "discharged"], default: "admitted" },
    transfers: [
      {
        fromBed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
        toBed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
        fromWard: { type: mongoose.Schema.Types.ObjectId, ref: "Ward" },
        toWard: { type: mongoose.Schema.Types.ObjectId, ref: "Ward" },
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],
    admittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);