const asyncHandler = require("express-async-handler");
const Admission = require("../models/Admission");
const Appointment = require("../models/Appointment");
const Bed = require("../models/Bed");
const Bill = require("../models/Bill");
const Doctor = require("../models/Doctor");
const LabOrder = require("../models/LabOrder");
const Medicine = require("../models/Medicine");
const Patient = require("../models/Patient");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const canSeeRevenue = ["admin", "receptionist"].includes(req.user.role);

  const [
    totalPatients,
    totalDoctors,
    todayAppointments,
    appointmentsByStatus,
    currentlyAdmitted,
    pendingLabOrders,
    lowStockMedicines,
    occupiedBeds,
    availableBeds,
    revenueTotals,
    todayRevenueTotals,
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments({ date: { $gte: startOfDay, $lt: startOfTomorrow } }),
    Appointment.aggregate([
      { $match: { date: { $gte: startOfDay, $lt: startOfTomorrow } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Admission.countDocuments({ status: "admitted" }),
    LabOrder.countDocuments({ status: { $in: ["ordered", "collected", "processing"] } }),
    Medicine.countDocuments({
      isActive: true,
      $expr: { $lte: ["$stock", "$reorderLevel"] },
    }),
    Bed.countDocuments({ status: "occupied" }),
    Bed.countDocuments({ status: "available" }),
    canSeeRevenue
      ? Bill.aggregate([{ $group: { _id: null, total: { $sum: "$paidAmount" } } }])
      : Promise.resolve([]),
    canSeeRevenue
      ? Bill.aggregate([
          { $unwind: "$payments" },
          { $match: { "payments.date": { $gte: startOfDay, $lt: startOfTomorrow } } },
          { $group: { _id: null, total: { $sum: "$payments.amount" } } },
        ])
      : Promise.resolve([]),
  ]);

  res.json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      todayAppointments,
      appointmentsByStatus,
      currentlyAdmitted,
      pendingLabOrders,
      lowStockMedicines,
      beds: { occupied: occupiedBeds, available: availableBeds },
      ...(canSeeRevenue && {
        totalRevenue: revenueTotals[0]?.total || 0,
        todayRevenue: todayRevenueTotals[0]?.total || 0,
      }),
    },
  });
});