import api, { unwrap } from "./axios";

export const getMedicines = (params) => unwrap(api.get("/pharmacy", { params }));
export const getMedicine = (id) => unwrap(api.get(`/pharmacy/${id}`));
export const addMedicine = (body) => unwrap(api.post("/pharmacy", body));
export const updateMedicine = (id, body) => unwrap(api.put(`/pharmacy/${id}`, body));
export const restockMedicine = (id, body) => unwrap(api.patch(`/pharmacy/${id}/restock`, body));
export const dispenseMedicines = (body) => unwrap(api.post("/pharmacy/dispense", body));
export const getLowStock = () => unwrap(api.get("/pharmacy/low-stock"));
export const getExpiring = (days = 30) => unwrap(api.get("/pharmacy/expiring", { params: { days } }));