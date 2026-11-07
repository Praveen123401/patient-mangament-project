const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    visitorName: { type: String, required: true, trim: true },
    phone: String,
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    relation: String,
    purpose: String,
    idProof: String,
    inTime: { type: Date, default: Date.now },
    outTime: Date,
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);