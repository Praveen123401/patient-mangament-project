import api, { unwrap } from "./axios";

export const getUsers = (params) => unwrap(api.get("/users", { params }));
export const getUser = (id) => unwrap(api.get(`/users/${id}`));
export const createUser = (body) => unwrap(api.post("/users", body));
export const updateUser = (id, body) => unwrap(api.put(`/users/${id}`, body));
export const deleteUser = (id) => unwrap(api.delete(`/users/${id}`));