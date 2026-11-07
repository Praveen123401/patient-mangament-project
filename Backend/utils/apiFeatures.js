const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchRegex = (s) => ({ $regex: escapeRegex(s), $options: "i" });

const sendPaginated = (res, data, total, { page, limit }) =>
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), data });

// Mongo range for a whole day. Pass "YYYY-MM-DD" or a Date.
const dayRange = (d) => {
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
};

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

module.exports = { getPagination, escapeRegex, searchRegex, sendPaginated, dayRange, today };