export const iso = (d) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const PRESETS = [
  { key: "today", label: "Today", get: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { key: "7d", label: "Last 7 days", get: () => ({ from: iso(daysAgo(6)), to: iso(new Date()) }) },
  { key: "30d", label: "Last 30 days", get: () => ({ from: iso(daysAgo(29)), to: iso(new Date()) }) },
  {
    key: "month",
    label: "This month",
    get: () => {
      const n = new Date();
      return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) };
    },
  },
  {
    key: "year",
    label: "This year",
    get: () => {
      const n = new Date();
      return { from: iso(new Date(n.getFullYear(), 0, 1)), to: iso(n) };
    },
  },
];

// "2026-11-05" -> "05 Nov"
export const shortDay = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" });

export const titleCase = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);