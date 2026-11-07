import api, { unwrap } from "./axios";

export const createPrescription = (body) => unwrap(api.post("/prescriptions", body));
export const getPatientPrescriptions = (patientId) =>
  unwrap(api.get(`/prescriptions/patient/${patientId}`));
export const getPrescription = (id) => unwrap(api.get(`/prescriptions/${id}`));