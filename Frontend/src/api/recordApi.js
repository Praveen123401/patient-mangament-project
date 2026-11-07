import api, { unwrap } from "./axios";

export const createRecord = (body) => unwrap(api.post("/records", body));
export const getPatientRecords = (patientId) => unwrap(api.get(`/records/patient/${patientId}`));
export const getRecord = (id) => unwrap(api.get(`/records/${id}`));
export const updateRecord = (id, body) => unwrap(api.put(`/records/${id}`, body));