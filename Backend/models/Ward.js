
const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ward name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "general",
        "icu",
        "emergency",
        "private",
        "semi-private",
        "maternity",
        "pediatric",
      ],
      default: "general",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    floor: {
      type: Number,
      min: 0,
      default: 0,
    },
    chargePerDay: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

wardSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Ward", wardSchema);
