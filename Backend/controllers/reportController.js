const asyncHandler = require("express-async-handler");
const Bill = require("../models/Bill");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Admission = require("../models/Admission");
const Discharge = require("../models/Discharge");
const Bed = require("../models/Bed");
const LabOrder = require("../models/LabOrder");
const Medicine = require("../models/Medicine");

const TZ = "Asia/Kolkata"; // days are grouped by Indian time
const OFFSET = "+05:30";
const DAY = "%Y-%m-%d";

const ymd = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: TZ });

const fail = (res, message) => {
  res.status(400);
  throw new Error(message);
};

// reads ?from=2026-11-01&to=2026-11-30 (default: the last 30 days)
const parseRange = (req, res) => {
  const fromStr = req.query.from || ymd(Date.now() - 29 * 86400000);
  const toStr = req.query.to || ymd(Date.now());
  const ok = /^\d{4}-\d{2}-\d{2}$/;
  if (!ok.test(fromStr) || !ok.test(toStr)) fail(res, "from and to must be dates like 2026-11-05");

  const from = new Date(`${fromStr}T00:00:00${OFFSET}`);
  const to = new Date(`${toStr}T23:59:59.999${OFFSET}`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) fail(res, "Invalid date");
  if (from > to) fail(res, "'from' cannot be after 'to'");
  if (to - from > 366 * 86400000) fail(res, "Choose a range of one year or less");

  return { fromStr, toStr, range: { $gte: from, $lte: to } };
};

// one row for every day of the range, zero when nothing happened that day
const fillDays = (fromStr, toStr, rows, key) => {
  const map = new Map(rows.map((r) => [r._id, r[key]]));
  const out = [];
  const d = new Date(`${fromStr}T00:00:00Z`);
  const end = new Date(`${toStr}T00:00:00Z`);
  while (d <= end) {
    const date = d.toISOString().slice(0, 10);
    out.push({ date, [key]: map.get(date) || 0 });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

const perDay = (field) => ({
  $group: {
    _id: { $dateToString: { format: DAY, date: field, timezone: TZ } },
    count: { $sum: 1 },
  },
});

const byKey = (rows, key = "count") => rows.map((r) => ({ name: r._id, [key]: r[key] }));

/* ---------------------------------------------------------------- revenue */
// GET /api/reports/revenue
exports.revenue = asyncHandler(async (req, res) => {
  const { fromStr, toStr, range } = parseRange(req, res);
  const paymentsInRange = [{ $unwind: "$payments" }, { $match: { "payments.date": range } }];

  const [daily, byMethod, billed, byCategory, outstanding] = await Promise.all([
    Bill.aggregate([
      ...paymentsInRange,
      {
        $group: {
          _id: { $dateToString: { format: DAY, date: "$payments.date", timezone: TZ } },
          amount: { $sum: "$payments.amount" },
        },
      },
    ]),
    Bill.aggregate([
      ...paymentsInRange,
      { $group: { _id: "$payments.method", amount: { $sum: "$payments.amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    Bill.aggregate([
      { $match: { createdAt: range } },
      { $group: { _id: null, billed: { $sum: "$totalAmount" }, bills: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { createdAt: range } },
      { $unwind: "$items" },
      {
        $project: {
          amount: { $multiply: ["$items.amount", "$items.quantity"] },
          category: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: "$items.description", regex: /^Lab - / } }, then: "Laboratory" },
                { case: { $regexMatch: { input: "$items.description", regex: /^Pharmacy - / } }, then: "Pharmacy" },
                { case: { $regexMatch: { input: "$items.description", regex: /^Bed charges/ } }, then: "Bed charges" },
              ],
              default: "Consultation and other",
            },
          },
        },
      },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
    ]),
    Bill.aggregate([
      { $match: { status: { $ne: "paid" } } },
      { $group: { _id: null, due: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } }, bills: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      range: { from: fromStr, to: toStr },
      totals: {
        collected: daily.reduce((s, r) => s + r.amount, 0),
        billed: billed[0]?.billed || 0,
        billsCreated: billed[0]?.bills || 0,
        outstanding: outstanding[0]?.due || 0, // all unpaid bills, not only this range
        outstandingBills: outstanding[0]?.bills || 0,
      },
      daily: fillDays(fromStr, toStr, daily, "amount"),
      byMethod: byMethod.map((m) => ({ method: m._id, amount: m.amount, count: m.count })),
      byCategory: byKey(byCategory, "amount"),
    },
  });
});

/* --------------------------------------------------------------- patients */
const AGE_LABELS = { 0: "0 to 12", 13: "13 to 18", 19: "19 to 39", 40: "40 to 59", 60: "60 and above", unknown: "Not recorded" };

// GET /api/reports/patients
exports.patients = asyncHandler(async (req, res) => {
  const { fromStr, toStr, range } = parseRange(req, res);

  const [newPatients, totalPatients, registrations, byGender, byAge, apptStatus, apptDoctor] = await Promise.all([
    Patient.countDocuments({ isActive: true, createdAt: range }),
    Patient.countDocuments({ isActive: true }),
    Patient.aggregate([{ $match: { isActive: true, createdAt: range } }, perDay("$createdAt")]),
    Patient.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$gender", count: { $sum: 1 } } }]),
    Patient.aggregate([
      { $match: { isActive: true } },
      { $bucket: { groupBy: "$age", boundaries: [0, 13, 19, 40, 60, 200], default: "unknown", output: { count: { $sum: 1 } } } },
    ]),
    Appointment.aggregate([{ $match: { date: range } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.aggregate([
      { $match: { date: range, status: { $ne: "cancelled" } } },
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doc" } },
      { $unwind: "$doc" },
      { $lookup: { from: "users", localField: "doc.user", foreignField: "_id", as: "usr" } },
      { $unwind: "$usr" },
      { $project: { _id: 0, name: { $concat: ["Dr. ", "$usr.name"] }, count: 1 } },
    ]),
  ]);

  const status = byKey(apptStatus);
  res.json({
    success: true,
    data: {
      range: { from: fromStr, to: toStr },
      totals: {
        newPatients,
        totalPatients,
        appointments: status.reduce((s, r) => s + r.count, 0),
        completed: status.find((s) => s.name === "completed")?.count || 0,
      },
      registrations: fillDays(fromStr, toStr, registrations, "count"),
      byGender: byKey(byGender),
      byAge: byAge.map((r) => ({ name: AGE_LABELS[r._id] || String(r._id), count: r.count })),
      appointmentsByStatus: status,
      appointmentsByDoctor: apptDoctor,
    },
  });
});

/* ------------------------------------------------------------- admissions */
// GET /api/reports/admissions
exports.admissions = asyncHandler(async (req, res) => {
  const { fromStr, toStr, range } = parseRange(req, res);

  const [admitted, discharged, current, beds, stay, daily, byWard, byCondition] = await Promise.all([
    Admission.countDocuments({ admitDate: range }),
    Discharge.countDocuments({ dischargeDate: range }),
    Admission.countDocuments({ status: "admitted" }),
    Bed.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Discharge.aggregate([{ $match: { dischargeDate: range } }, { $group: { _id: null, avg: { $avg: "$daysStayed" } } }]),
    Admission.aggregate([{ $match: { admitDate: range } }, perDay("$admitDate")]),
    Admission.aggregate([
      { $match: { admitDate: range } },
      { $group: { _id: "$ward", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: "wards", localField: "_id", foreignField: "_id", as: "w" } },
      { $unwind: { path: "$w", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ["$w.name", "Unknown"] }, count: 1 } },
    ]),
    Discharge.aggregate([{ $match: { dischargeDate: range } }, { $group: { _id: "$condition", count: { $sum: 1 } } }]),
  ]);

  const bedMap = Object.fromEntries(beds.map((b) => [b._id, b.count]));
  const totalBeds = beds.reduce((s, b) => s + b.count, 0);
  const occupied = bedMap.occupied || 0;

  res.json({
    success: true,
    data: {
      range: { from: fromStr, to: toStr },
      totals: {
        admitted,
        discharged,
        currentlyAdmitted: current,
        avgStayDays: stay[0]?.avg ? Number(stay[0].avg.toFixed(1)) : 0,
        totalBeds,
        occupancyPercent: totalBeds ? Math.round((occupied / totalBeds) * 100) : 0,
      },
      daily: fillDays(fromStr, toStr, daily, "count"),
      beds: { available: bedMap.available || 0, occupied, maintenance: bedMap.maintenance || 0 },
      byWard,
      dischargeByCondition: byKey(byCondition),
    },
  });
});

/* -------------------------------------------------------------------- lab */
// GET /api/reports/lab
exports.lab = asyncHandler(async (req, res) => {
  const { fromStr, toStr, range } = parseRange(req, res);
  const base = { createdAt: range };
  const live = { ...base, status: { $ne: "cancelled" } };

  const [statusRows, revenue, testRows, critical, turnaround] = await Promise.all([
    LabOrder.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    LabOrder.aggregate([{ $match: live }, { $group: { _id: null, amount: { $sum: "$totalAmount" } } }]),
    LabOrder.aggregate([
      { $match: live },
      { $unwind: "$tests" },
      { $lookup: { from: "labtests", localField: "tests.test", foreignField: "_id", as: "t" } },
      { $unwind: "$t" },
      { $group: { _id: { name: "$t.name", category: "$t.category" }, count: { $sum: 1 } } },
    ]),
    LabOrder.aggregate([
      { $match: base },
      { $unwind: "$tests" },
      { $match: { "tests.flag": "critical" } },
      { $count: "n" },
    ]),
    LabOrder.aggregate([
      { $match: { ...base, status: "completed", completedAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ["$completedAt", "$createdAt"] } } } },
    ]),
  ]);

  const categories = {};
  testRows.forEach((r) => {
    categories[r._id.category] = (categories[r._id.category] || 0) + r.count;
  });
  const status = byKey(statusRows);

  res.json({
    success: true,
    data: {
      range: { from: fromStr, to: toStr },
      totals: {
        orders: status.reduce((s, r) => s + r.count, 0),
        completed: status.find((s) => s.name === "completed")?.count || 0,
        revenue: revenue[0]?.amount || 0,
        criticalResults: critical[0]?.n || 0,
        avgTurnaroundHours: turnaround[0]?.avgMs ? Number((turnaround[0].avgMs / 3600000).toFixed(1)) : 0,
      },
      byStatus: status,
      byCategory: Object.entries(categories).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topTests: testRows
        .map((r) => ({ name: r._id.name, count: r.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    },
  });
});

/* --------------------------------------------------------------- pharmacy */
// GET /api/reports/pharmacy  (stock is the current stock, sales follow the date range)
exports.pharmacy = asyncHandler(async (req, res) => {
  const { fromStr, toStr, range } = parseRange(req, res);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86400000);

  const pharmacyItems = [
    { $match: { createdAt: range } },
    { $unwind: "$items" },
    { $match: { "items.description": /^Pharmacy - / } },
  ];
  const lineAmount = { $multiply: ["$items.amount", "$items.quantity"] };

  const [inventory, lowStock, expiring, expired, sales, topSold] = await Promise.all([
    Medicine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, medicines: { $sum: 1 }, units: { $sum: "$stock" }, value: { $sum: { $multiply: ["$stock", "$price"] } } } },
    ]),
    Medicine.find({ isActive: true, $expr: { $lte: ["$stock", "$reorderLevel"] } })
      .sort("stock")
      .limit(10)
      .select("name category stock reorderLevel"),
    Medicine.find({ isActive: true, expiryDate: { $gte: now, $lte: soon } })
      .sort("expiryDate")
      .limit(10)
      .select("name stock batchNo expiryDate"),
    Medicine.countDocuments({ isActive: true, expiryDate: { $lt: now } }),
    Bill.aggregate([
      ...pharmacyItems,
      { $group: { _id: null, units: { $sum: "$items.quantity" }, amount: { $sum: lineAmount } } },
    ]),
    Bill.aggregate([
      ...pharmacyItems,
      { $group: { _id: "$items.description", units: { $sum: "$items.quantity" }, amount: { $sum: lineAmount } } },
      { $sort: { amount: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      range: { from: fromStr, to: toStr },
      totals: {
        medicines: inventory[0]?.medicines || 0,
        stockUnits: inventory[0]?.units || 0,
        stockValue: inventory[0]?.value || 0,
        expired,
        soldUnits: sales[0]?.units || 0,
        soldAmount: sales[0]?.amount || 0,
      },
      lowStock,
      expiring,
      topSold: topSold.map((r) => ({
        name: String(r._id).replace(/^Pharmacy - /, ""),
        units: r.units,
        amount: r.amount,
      })),
    },
  });
});