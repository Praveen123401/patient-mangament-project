

export const HOSPITAL_NAME = "Patient Management System";
export const SERVICE_HOURS = "24 × 7";
export const HELPLINE = ""; // put your real number here, for example "080 1234 5678". Leave empty to hide it.

/* ---------- roles ---------- */
export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTIONIST: "receptionist",
  LAB_TECH: "labtech",
  PHARMACIST: "pharmacist",
  PATIENT: "patient",
};

// roles allowed to see Aadhaar, ration card and income in full
export const FULL_ACCESS_ROLES = ["admin", "receptionist"];

/* ---------- general lists ---------- */
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const GENDERS = ["male", "female", "other"];
export const MARITAL_STATUS = ["single", "married", "widowed", "divorced"];
export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ---------- hospital ---------- */
export const WARD_TYPES = ["general", "semi-private", "private", "icu", "emergency"];
export const LAB_CATEGORIES = ["blood", "urine", "hormone", "stool", "microbiology", "imaging", "other"];
export const PAYMENT_METHODS = ["cash", "card", "upi", "insurance"];
export const DISCHARGE_CONDITIONS = ["recovered", "improved", "referred", "lama", "deceased"];

/* ---------- patient: schemes and ration card ---------- */
export const GOV_SCHEMES = ["Ayushman Bharat", "CGHS", "ESI", "State health scheme", "None"];

export const RATION_CARD_OPTIONS = [
  { value: "APL", label: "APL (above poverty line)" },
  { value: "BPL", label: "BPL (below poverty line)" },
  { value: "AAY", label: "AAY (Antyodaya Anna Yojana)" },
  { value: "PHH", label: "PHH (priority household)" },
  { value: "NPHH", label: "NPHH (non-priority household)" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/* ---------- doctors and departments ---------- */
// each specialization points to the department it normally belongs to
export const SPECIALIZATIONS = [
  { name: "General Physician", department: "General Medicine" },
  { name: "Family Medicine", department: "General Medicine" },
  { name: "Cardiologist", department: "Cardiology" },
  { name: "Neurologist", department: "Neurology" },
  { name: "Neurosurgeon", department: "Neurology" },
  { name: "Orthopedic Surgeon", department: "Orthopedics" },
  { name: "Pediatrician", department: "Pediatrics" },
  { name: "Gynecologist", department: "Gynecology & Obstetrics" },
  { name: "Obstetrician", department: "Gynecology & Obstetrics" },
  { name: "Dermatologist", department: "Dermatology" },
  { name: "ENT Specialist", department: "ENT" },
  { name: "Ophthalmologist", department: "Ophthalmology" },
  { name: "Psychiatrist", department: "Psychiatry" },
  { name: "Urologist", department: "Urology" },
  { name: "Nephrologist", department: "Nephrology" },
  { name: "Gastroenterologist", department: "Gastroenterology" },
  { name: "Pulmonologist", department: "Pulmonology" },
  { name: "Endocrinologist", department: "Endocrinology" },
  { name: "Diabetologist", department: "Endocrinology" },
  { name: "Oncologist", department: "Oncology" },
  { name: "General Surgeon", department: "General Surgery" },
  { name: "Dentist", department: "Dentistry" },
  { name: "Radiologist", department: "Radiology" },
  { name: "Pathologist", department: "Pathology" },
  { name: "Anesthesiologist", department: "Anesthesiology" },
  { name: "Emergency Physician", department: "Emergency Medicine" },
  { name: "Physiotherapist", department: "Physiotherapy" },
  { name: "Dietitian", department: "Dietetics" },
];

export const DEFAULT_DEPARTMENTS = [
  "General Medicine", "Cardiology", "Neurology", "Orthopedics", "Pediatrics",
  "Gynecology & Obstetrics", "Dermatology", "ENT", "Ophthalmology", "Psychiatry",
  "Urology", "Nephrology", "Gastroenterology", "Pulmonology", "Endocrinology",
  "Oncology", "General Surgery", "Dentistry", "Radiology", "Pathology",
  "Anesthesiology", "Emergency Medicine", "Physiotherapy", "Dietetics",
]; 
// shown on invoices; empty lines are hidden
export const HOSPITAL_INFO = {
  address: "", // e.g. "12 MG Road, Bengaluru 560001"
  phone: "", // e.g. "080 1234 5678"
  email: "",
  gstin: "",
};

// your hospital's UPI ID: turns on the "scan to pay" QR code (leave "" to hide it)
export const UPI_ID = ""; // e.g. "yourhospital@okaxis"
export const UPI_NAME = HOSPITAL_NAME;

// optional note printed at the bottom of every invoice, e.g. "Fees once paid are not refundable."
export const INVOICE_TERMS = ""; 


// created in one click on the Wards page; edit the prices afterwards
export const STANDARD_WARDS = [
  { name: "General Ward", type: "general", floor: 1, chargePerDay: 1000, prefix: "G", beds: 10 },
  { name: "Semi-Private Ward", type: "semi-private", floor: 2, chargePerDay: 2000, prefix: "S", beds: 6 },
  { name: "Private Rooms", type: "private", floor: 2, chargePerDay: 3500, prefix: "P", beds: 4 },
  { name: "ICU", type: "icu", floor: 1, chargePerDay: 6000, prefix: "ICU", beds: 4 },
  { name: "Emergency Ward", type: "emergency", floor: 0, chargePerDay: 1500, prefix: "E", beds: 4 },
];