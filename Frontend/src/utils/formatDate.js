const ok = (d) => d && !Number.isNaN(new Date(d).getTime());

export const formatDate = (d) =>
  ok(d) ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const formatDay = (d) =>
  ok(d) ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "-";

export const formatTime = (d) =>
  ok(d) ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-";

export const formatDateTime = (d) => (ok(d) ? `${formatDate(d)}, ${formatTime(d)}` : "-");

// for <input type="date">
export const toInputDate = (d = new Date()) => new Date(d).toLocaleDateString("en-CA");