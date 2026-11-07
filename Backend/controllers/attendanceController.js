const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const { today, getPagination, sendPaginated } = require("../utils/apiFeatures");

// POST /api/attendance/check-in
exports.checkIn = asyncHandler(async (req, res) => {
  const date = today();
  if (await Attendance.findOne({ user: req.user.id, date })) {
    res.status(400);
    throw new Error("Already checked in today");
  }
  const rec = await Attendance.create({ user: req.user.id, date, checkIn: new Date() });
  res.status(201).json({ success: true, data: rec });
});

// POST /api/attendance/check-out
exports.checkOut = asyncHandler(async (req, res) => {
  const rec = await Attendance.findOne({ user: req.user.id, date: today() });
  if (!rec) {
    res.status(400);
    throw new Error("You have not checked in today");
  }
  if (rec.checkOut) {
    res.status(400);
    throw new Error("Already checked out today");
  }
  rec.checkOut = new Date();
  rec.hoursWorked = Number(((rec.checkOut - rec.checkIn) / 36e5).toFixed(2));
  await rec.save();
  res.json({ success: true, data: rec });
});

// GET /api/attendance/me?month=2026-10
exports.getMyAttendance = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.month) filter.date = new RegExp(`^${req.query.month.replace(/[^0-9-]/g, "")}`);
  const data = await Attendance.find(filter).sort("-date");
  res.json({ success: true, count: data.length, data });
});

// GET /api/attendance?date=&user=&month=   (admin)
exports.getAllAttendance = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.date) filter.date = req.query.date;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.month) filter.date = new RegExp(`^${req.query.month.replace(/[^0-9-]/g, "")}`);
  const [data, total] = await Promise.all([
    Attendance.find(filter).populate("user", "name role").sort("-date").skip(pg.skip).limit(pg.limit),
    Attendance.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});