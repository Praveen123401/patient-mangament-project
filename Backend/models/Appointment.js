
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // 24-hour format: "09:30"
    timeSlot: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Time slot must be in HH:mm format",
      ],
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    cancelReason: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent two active appointments from using the same
// doctor, date and time slot.
appointmentSchema.index(
  {
    doctor: 1,
    date: 1,
    timeSlot: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
