import api, { unwrap } from "./axios";

export const getAppointments = (params) =>
  unwrap(api.get("/appointments", { params }));

export const getAppointment = (id) =>
  unwrap(api.get(`/appointments/${id}`));

export const bookAppointment = (body) =>
  unwrap(api.post("/appointments", body));

export const rescheduleAppointment = (id, body) =>
  unwrap(api.patch(`/appointments/${id}/reschedule`, body));

export const updateAppointmentStatus = (id, status) =>
  unwrap(api.patch(`/appointments/${id}/status`, { status }));

export const cancelAppointment = (id, reason) =>
  unwrap(api.patch(`/appointments/${id}/cancel`, { reason }));