
const mongoose = require("mongoose");

const SPECIALIZATIONS = [
  "General Physician",
  "General Medicine",
  "Family Medicine",
  "Internal Medicine",
  "Cardiology",
  "Interventional Cardiology",
  "Cardiologist",
  "Neurology",
  "Neurologist",
  "Neurosurgery",
  "Neurosurgeon",
  "Orthopedics",
  "Orthopedic Surgeon",
  "Pediatrics",
  "Pediatrician",
  "Neonatology",
  "Gynecology",
  "Gynecologist",
  "Obstetrics",
  "Obstetrician",
  "Dermatology",
  "Dermatologist",
  "General Surgery",
  "Plastic Surgery",
  "Urology",
  "Urologist",
  "Nephrology",
  "Nephrologist",
  "Oncology",
  "Oncologist",
  "Surgical Oncology",
  "Radiation Oncology",
  "Ophthalmology",
  "Ophthalmologist",
  "ENT",
  "ENT Specialist",
  "Psychiatry",
  "Psychiatrist",
  "Psychology",
  "Pulmonology",
  "Pulmonologist",
  "Gastroenterology",
  "Gastroenterologist",
  "Hepatology",
  "Endocrinology",
  "Endocrinologist",
  "Diabetology",
  "Diabetologist",
  "Rheumatology",
  "Anesthesiology",
  "Anesthesiologist",
  "Radiology",
  "Radiologist",
  "Pathology",
  "Pathologist",
  "Microbiology",
  "Emergency Medicine",
  "Emergency Physician",
  "Critical Care Medicine",
  "Geriatrics",
  "Physiotherapy",
  "Physiotherapist",
  "Sports Medicine",
  "Infectious Diseases",
  "Hematology",
  "Pain Management",
  "Dietitian",
  "Dentistry",
  "Dentist",
  "General Dentist",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral and Maxillofacial Surgeon",
  "Pediatric Dentist",
  "Prosthodontist",
  "Other",
];

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      enum: SPECIALIZATIONS,
    },

    qualification: {
      type: String,
      trim: true,
    },

    experience: {
      type: Number,
      min: 0,
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    availability: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        startTime: String,
        endTime: String,
        slotDuration: {
          type: Number,
          default: 15,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);
