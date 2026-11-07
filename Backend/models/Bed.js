
const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model("Bed", bedSchema);
