import api, { unwrap } from "./axios";

export const getDashboardStats = () => unwrap(api.get("/dashboard/stats"));