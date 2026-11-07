
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    // 1. Hospital identification
    patientId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    registrationDate: {
      type: Date,
      default: Date.now,
    },

    registrationStatus: {
      type: String,
      enum: ["registered", "pending", "active", "inactive"],
      default: "registered",
    },

    patientType: {
      type: String,
      enum: ["OPD", "IPD", "Emergency"],
      default: "OPD",
    },

    admissionDate: {
      type: Date,
      default: null,
    },

    // 2. Personal information
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    guardianName: {
      type: String,
      trim: true,
    },

    guardianRelation: {
      type: String,
      trim: true,
    },

    dob: {
      type: Date,
      validate: {
        validator: (value) => !value || value <= new Date(),
        message: "Date of birth cannot be in the future",
      },
    },

    age: {
      type: Number,
      min: 0,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    maritalStatus: {
      type: String,
      enum: ["single", "married", "widowed", "divorced"],
    },

    occupation: {
      type: String,
      trim: true,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    // 3. Medical information
    allergies: {
      type: [String],
      default: [],
    },

    medicalConditions: {
      type: [String],
      default: [],
    },

    currentMedications: {
      type: [String],
      default: [],
    },

    medicalHistory: {
      type: String,
      trim: true,
    },

    // 4. Contact and address
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      match: [
        /^[1-9]\d{5}$/,
        "Pincode must be 6 digits",
      ],
    },

    // 5. Government identity details
    aadhaarNumber: {
      type: String,
      match: [
        /^[2-9]\d{11}$/,
        "Aadhaar must be 12 digits and start with 2 to 9",
      ],
      unique: true,
      sparse: true,
    },

    // 6. Ration card details
    hasRationCard: {
      type: Boolean,
      default: false,
    },

    rationCardNumber: {
      type: String,
      trim: true,
      uppercase: true,
      required: function () {
        return this.hasRationCard === true;
      },
    },

    rationCardType: {
      type: String,
      enum: ["APL", "BPL", "AAY", "PHH", "NPHH"],
      required: function () {
        return this.hasRationCard === true;
      },
    },

    annualIncome: {
      type: Number,
      min: 0,
    },

    // 7. Government healthcare scheme
    governmentScheme: {
      type: String,
      enum: [
        "None",
        "PM-JAY",
        "State Scheme",
        "ESI",
        "CGHS",
        "Other",
      ],
      default: "None",
    },

    schemeMemberId: {
      type: String,
      trim: true,
    },

    // 8. Emergency contact
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      relation: {
        type: String,
        trim: true,
      },
    },

    // 9. Hospital department
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // 10. Assigned doctor
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // 11. Linked user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 12. Record management
    isActive: {
      type: Boolean,
      default: true,
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

// Automatically calculate age using date of birth
patientSchema.pre("validate", function () {
  if (!this.dob) {
    this.age = undefined;
    return;
  }

  const today = new Date();
  const birthDate = new Date(this.dob);

  let age =
    today.getFullYear() - birthDate.getFullYear();

  const birthdayNotReached =
    today.getMonth() < birthDate.getMonth() ||
    (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate()
    );

  if (birthdayNotReached) {
    age--;
  }

  this.age = age;
});

// Export Patient model
module.exports =
  mongoose.models.Patient ||
  mongoose.model("Patient", patientSchema);
