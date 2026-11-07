import api, { unwrap } from "./axios";

export const login = (body) => unwrap(api.post("/auth/login", body));
export const register = (body) => unwrap(api.post("/auth/register", body));
export const forgotPassword = (email) => unwrap(api.post("/auth/forgot-password", { email }));
export const verifyResetOtp = (email, otp) =>
  unwrap(api.post("/auth/verify-reset-otp", { email, otp }));
export const resetPassword = (email, otp, newPassword) =>
  unwrap(api.post("/auth/reset-password", { email, otp, newPassword }));
export const getMe = () => unwrap(api.get("/auth/me"));
export const changePassword = (currentPassword, newPassword) =>
  unwrap(api.put("/auth/change-password", { currentPassword, newPassword }));