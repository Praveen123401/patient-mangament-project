import api, { unwrap } from "./axios";

export const getDepartments = () => unwrap(api.get("/departments"));
export const getDepartment = (id) => unwrap(api.get(`/departments/${id}`));
export const createDepartment = (body) => unwrap(api.post("/departments", body));
export const updateDepartment = (id, body) => unwrap(api.put(`/departments/${id}`, body));
export const deleteDepartment = (id) => unwrap(api.delete(`/departments/${id}`));