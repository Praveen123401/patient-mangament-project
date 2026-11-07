// every check accepts undefined or empty values safely
const clean = (v) => String(v ?? "").trim();

export const required = (v) => (clean(v) ? "" : "Required");

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v));
export const isPhone = (v) => /^\d{10}$/.test(clean(v)); // 10 digits, as in your version
export const isAadhaar = (v) => /^[2-9]\d{11}$/.test(clean(v).replace(/\s/g, ""));
export const isPincode = (v) => /^[1-9]\d{5}$/.test(clean(v));

// f = the flat form values from PatientForm.
// Returns { fieldName: "message" }. An empty object means the form is valid.
export const validatePatient = (f, { fullAccess = true } = {}) => {
  const e = {};

  if (clean(f.name).length < 2) e.name = "Enter a name with at least 2 characters";
  if (!f.gender) e.gender = "Select gender";
  if (!isPhone(f.phone)) e.phone = "Enter a valid 10 digit mobile number";
  if (clean(f.alternatePhone) && !isPhone(f.alternatePhone)) e.alternatePhone = "Enter a valid 10 digit mobile number";
  if (clean(f.email) && !isEmail(f.email)) e.email = "Enter a valid email address";
  if (clean(f.ecPhone) && !isPhone(f.ecPhone)) e.ecPhone = "Enter a valid 10 digit mobile number";
  if (clean(f.pincode) && !isPincode(f.pincode)) e.pincode = "Enter a valid 6 digit pincode";
  // only admin and reception fill these in
  if (fullAccess) {
    if (clean(f.aadhaarNumber) && !isAadhaar(f.aadhaarNumber)) {
      e.aadhaarNumber = "Aadhaar has 12 digits and starts with 2 to 9";
    }
    if (f.annualIncome !== "" && f.annualIncome != null && (Number.isNaN(Number(f.annualIncome)) || Number(f.annualIncome) < 0)) {
      e.annualIncome = "Enter a valid amount";
    }
  }

  return e;
};