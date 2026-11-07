import api, { unwrap } from "./axios";

export const getAdmissions = (params) => unwrap(api.get("/admissions", { params }));
export const getAdmission = (id) => unwrap(api.get(`/admissions/${id}`));
export const admitPatient = (body) => unwrap(api.post("/admissions", body));
export const transferBed = (id, body) => unwrap(api.patch(`/admissions/${id}/transfer`, body));