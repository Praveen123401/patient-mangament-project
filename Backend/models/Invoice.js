const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
    },
    patientPhone: String,
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "PARTIAL", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: String,
    emailStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
