import api from "./axios";

// These endpoints need reportController on the backend (not written yet)
export const getRevenueReport = (params) => api.get("/reports/revenue", { params }).then((r) => r.data);
export const getPatientReport = (params) => api.get("/reports/patients", { params }).then((r) => r.data);
export const getAdmissionReport = (params) => api.get("/reports/admissions", { params }).then((r) => r.data);
export const getLabReport = (params) => api.get("/reports/lab", { params }).then((r) => r.data);
export const getPharmacyReport = (params) => api.get("/reports/pharmacy", { params }).then((r) => r.data);