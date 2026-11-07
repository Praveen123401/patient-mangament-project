import api, { unwrap } from "./axios";

export const getPatients = (params) => unwrap(api.get("/patients", { params }));
export const getPatient = (id) => unwrap(api.get(`/patients/${id}`));
export const createPatient = (body) => unwrap(api.post("/patients", body));
export const updatePatient = (id, body) => unwrap(api.put(`/patients/${id}`, body));
export const deletePatient = (id) => unwrap(api.delete(`/patients/${id}`));
export const getPatientHistory = (id) => unwrap(api.get(`/patients/${id}/history`));