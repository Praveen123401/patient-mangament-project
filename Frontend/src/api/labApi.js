import api, { unwrap } from "./axios";

// test catalog (blood, urine, hormone ...)
export const getLabTests = (params) => unwrap(api.get("/lab/tests", { params }));
export const createLabTest = (body) => unwrap(api.post("/lab/tests", body));
export const updateLabTest = (id, body) => unwrap(api.put(`/lab/tests/${id}`, body));
export const deleteLabTest = (id) => unwrap(api.delete(`/lab/tests/${id}`));

// orders
export const getLabOrders = (params) => unwrap(api.get("/lab/orders", { params }));
export const getLabOrder = (id) => unwrap(api.get(`/lab/orders/${id}`));
export const getPatientLabHistory = (patientId) =>
  unwrap(api.get(`/lab/orders/patient/${patientId}`));
export const createLabOrder = (body) => unwrap(api.post("/lab/orders", body));
export const collectSample = (id) => unwrap(api.patch(`/lab/orders/${id}/collect`));
export const enterResults = (id, results) => unwrap(api.put(`/lab/orders/${id}/results`, { results }));
export const verifyLabOrder = (id) => unwrap(api.patch(`/lab/orders/${id}/verify`));
export const cancelLabOrder = (id) => unwrap(api.patch(`/lab/orders/${id}/cancel`));