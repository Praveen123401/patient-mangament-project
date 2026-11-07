import api, { unwrap } from "./axios";

// list of discharge records (optional ?patient=ID&page=1&limit=10)
export const getDischarges = (params) => unwrap(api.get("/discharge", { params }));

// one full discharge record (patient, admission and bill included)
export const getDischarge = (id) => unwrap(api.get(`/discharge/record/${id}`));

// discharge a patient: POST /api/discharge/:admissionId
// body: { condition, finalDiagnosis, treatmentGiven, summary, medicinesOnDischarge, followUpDate }
export const dischargePatient = (admissionId, body) =>
  unwrap(api.post(`/discharge/${admissionId}`, body));