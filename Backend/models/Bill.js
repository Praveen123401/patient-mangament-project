const mongoose = require("mongoose");
const PAYMENT_METHODS = require("../config/paymentMethods");

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", default: null },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
    payments: [
      {
        amount: { type: Number, required: true, min: 1 },
        method: { type: String, enum: PAYMENT_METHODS, default: "cash" },
        reference: { type: String, trim: true, maxlength: 60 }, // UPI transaction ID, UTR, cheque number
        date: { type: Date, default: Date.now },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);