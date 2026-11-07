import api, { unwrap } from "./axios";

export const getMe = () => unwrap(api.get("/auth/me"));
export const changePassword = (currentPassword, newPassword) =>
  unwrap(api.put("/auth/change-password", { currentPassword, newPassword }));