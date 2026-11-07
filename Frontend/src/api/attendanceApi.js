import api, { unwrap } from "./axios";

export const checkIn = () => unwrap(api.post("/attendance/check-in"));
export const checkOut = () => unwrap(api.post("/attendance/check-out"));
export const getMyAttendance = (month) => unwrap(api.get("/attendance/me", { params: { month } }));
export const getAllAttendance = (params) => unwrap(api.get("/attendance", { params }));