import api, { unwrap } from "./axios";

export const getBeds = (params) => unwrap(api.get("/beds", { params }));
export const getAvailableBeds = (params) => unwrap(api.get("/beds/available", { params }));
export const createBed = (body) => unwrap(api.post("/beds", body));
export const updateBedStatus = (id, status) => unwrap(api.patch(`/beds/${id}/status`, { status }));
export const deleteBed = (id) => unwrap(api.delete(`/beds/${id}`));