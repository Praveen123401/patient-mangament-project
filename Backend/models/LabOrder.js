const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission" },
    tests: [
      {
        test: { type: mongoose.Schema.Types.ObjectId, ref: "LabTest", required: true },
        value: String,
        unit: String,
        flag: { type: String, enum: ["normal", "low", "high", "critical", "n/a"], default: "n/a" },
        remarks: String,
      },
    ],
    priority: { type: String, enum: ["routine", "urgent"], default: "routine" },
    status: {
      type: String,
      enum: ["ordered", "collected", "processing", "completed", "cancelled"],
      default: "ordered",
    },
    totalAmount: { type: Number, default: 0 },
    sampleCollectedAt: Date,
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabOrder", labOrderSchema);