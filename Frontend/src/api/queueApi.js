import api, { unwrap } from "./axios";

// Backend queueController and Token model are not written yet
export const getQueue = (doctorId) => unwrap(api.get("/queue", { params: { doctor: doctorId } }));
export const issueToken = (body) => unwrap(api.post("/queue/token", body));
export const callNext = (doctorId) => unwrap(api.post("/queue/call-next", { doctor: doctorId }));
export const updateToken = (id, status) => unwrap(api.patch(`/queue/${id}`, { status }));