import api, { unwrap } from "./axios";

export const getVisitors = (params) => unwrap(api.get("/visitors", { params }));
export const visitorIn = (body) => unwrap(api.post("/visitors/in", body));
export const visitorOut = (id) => unwrap(api.patch(`/visitors/${id}/out`));