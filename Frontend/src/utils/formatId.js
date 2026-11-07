// keep digits only, optionally cut to a maximum length
export const digitsOnly = (v, max = 20) => String(v || "").replace(/\D/g, "").slice(0, max);

// 123456789012 -> 1234 5678 9012   (masked values like XXXXXXXX1234 work too)
export const formatAadhaar = (v) => String(v || "").replace(/\s/g, "").replace(/(.{4})(?=.)/g, "$1 ");
