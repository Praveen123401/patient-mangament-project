import api, { unwrap } from "./axios";

export const getBills = (params) => unwrap(api.get("/billing", { params }));
export const getBill = (id) => unwrap(api.get(`/billing/${id}`));
export const emailBill = (id) => unwrap(api.post(`/billing/${id}/email`));
export const createBill = (body) => unwrap(api.post("/billing", body));
export const addBillItem = (id, body) => unwrap(api.post(`/billing/${id}/items`, body));
export const addPayment = (id, body) => unwrap(api.post(`/billing/${id}/payments`, body));