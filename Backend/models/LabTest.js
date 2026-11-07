
const mongoose = require("mongoose");

const labTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "blood",
        "blood_sugar",
        "kidney",
        "liver",
        "thyroid",
        "urine",
        "lipid",
        "cardiac",
        "imaging",
        "dental",
        "other",
      ],
      required: true,
    },

    // Doctors who can see this test as a recommendation
    specializations: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: String,

    normalRange: {
      min: Number,
      max: Number,
    },

    criticalLow: Number,
    criticalHigh: Number,
    sampleType: String,

    fastingRequired: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabTest", labTestSchema);
