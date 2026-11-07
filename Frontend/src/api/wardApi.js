import api, { unwrap } from "./axios";

export const getWards = () => unwrap(api.get("/wards"));
export const getWard = (id) => unwrap(api.get(`/wards/${id}`));
export const createWard = (body) => unwrap(api.post("/wards", body));
export const updateWard = (id, body) => unwrap(api.put(`/wards/${id}`, body));
export const deleteWard = (id) => unwrap(api.delete(`/wards/${id}`));