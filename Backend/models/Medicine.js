const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: String,
    category: String,
    unit: { type: String, default: "tablet" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10 },
    expiryDate: Date,
    batchNo: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);