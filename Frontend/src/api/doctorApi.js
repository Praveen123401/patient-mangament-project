import api, { unwrap } from "./axios";

export const getDoctors = (params) =>
  unwrap(api.get("/doctors", { params }));

export const getDoctor = (id) =>
  unwrap(api.get(`/doctors/${id}`));

export const createDoctor = (body) =>
  unwrap(api.post("/doctors", body));

export const updateDoctor = (id, body) =>
  unwrap(api.put(`/doctors/${id}`, body));

export const setAvailability = (id, availability) =>
  unwrap(api.put(`/doctors/${id}/availability`, { availability }));

export const getSlots = (id, date) =>
  unwrap(api.get(`/doctors/${id}/slots`, { params: { date } }));