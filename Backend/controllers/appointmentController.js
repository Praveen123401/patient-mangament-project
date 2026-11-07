const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

const populateAppointment = (query) =>
  query
    .populate("patient", "name fullName patientId")
    .populate({
      path: "doctor",
      select: "specialization",
      populate: { path: "user", select: "name" },
    });

const parseAppointmentDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

const isValidTimeSlot = (doctor, date, timeSlot) => {
  if (typeof timeSlot !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeSlot)) {
    return false;
  }

  const day = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const slotMinutes = timeSlot.split(":").reduce((hours, part, index) =>
    hours + Number(part) * (index === 0 ? 60 : 1), 0);

  return doctor.availability.some((schedule) => {
    if (schedule.day !== day || !schedule.startTime || !schedule.endTime) return false;
    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = Number(schedule.slotDuration) || 15;

    return slotMinutes >= startMinutes &&
      slotMinutes + duration <= endMinutes &&
      (slotMinutes - startMinutes) % duration === 0;
  });
};

const findActiveDoctor = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Doctor.findOne({ _id: id, isActive: true });
};

const assertSlotAvailable = async (res, { doctor, date, timeSlot, excludeId }) => {
  if (!isValidTimeSlot(doctor, date, timeSlot)) {
    res.status(400);
    throw new Error("The selected time is outside the doctor's availability");
  }

  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const filter = {
    doctor: doctor._id,
    date: { $gte: date, $lt: dayEnd },
    timeSlot,
    status: { $ne: "cancelled" },
  };
  if (excludeId) filter._id = { $ne: excludeId };

  if (await Appointment.exists(filter)) {
    res.status(409);
    throw new Error("This time slot is already booked");
  }
};

exports.getAppointments = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.doctor) filter.doctor = req.query.doctor;

  const appointments = await populateAppointment(
    Appointment.find(filter).sort({ date: 1, timeSlot: 1 })
  );

  res.json({ success: true, data: appointments });
});

exports.getAppointment = asyncHandler(async (req, res) => {
  const appointment = await populateAppointment(
    Appointment.findById(req.params.id)
  );

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  res.json({ success: true, data: appointment });
});

exports.bookAppointment = asyncHandler(async (req, res) => {
  const { patient, doctor: doctorId, date: dateValue, timeSlot, reason } = req.body;
  const date = parseAppointmentDate(dateValue);

  if (
    !mongoose.Types.ObjectId.isValid(patient) ||
    !mongoose.Types.ObjectId.isValid(doctorId) ||
    !date ||
    typeof timeSlot !== "string"
  ) {
    res.status(400);
    throw new Error("Patient, doctor, valid date and time slot are required");
  }

  const [patientExists, doctor] = await Promise.all([
    Patient.exists({ _id: patient, isActive: true }),
    findActiveDoctor(doctorId),
  ]);
  if (!patientExists) {
    res.status(404);
    throw new Error("Patient not found");
  }
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  await assertSlotAvailable(res, { doctor, date, timeSlot });
  const appointment = await Appointment.create({
    patient,
    doctor: doctor._id,
    date,
    timeSlot,
    reason: typeof reason === "string" ? reason.trim() : "",
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: await populateAppointment(Appointment.findById(appointment._id)),
  });
});

exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  if (!["pending", "confirmed"].includes(appointment.status)) {
    res.status(400);
    throw new Error("Only pending or confirmed appointments can be rescheduled");
  }

  const date = parseAppointmentDate(req.body.date);
  if (!date || typeof req.body.timeSlot !== "string") {
    res.status(400);
    throw new Error("A valid date and time slot are required");
  }

  const doctor = await findActiveDoctor(appointment.doctor);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }
  await assertSlotAvailable(res, {
    doctor,
    date,
    timeSlot: req.body.timeSlot,
    excludeId: appointment._id,
  });

  appointment.date = date;
  appointment.timeSlot = req.body.timeSlot;
  await appointment.save();

  res.json({ success: true, data: await populateAppointment(Appointment.findById(appointment._id)) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  if (!transitions[appointment.status]?.includes(req.body.status)) {
    res.status(400);
    throw new Error("Invalid appointment status transition");
  }

  appointment.status = req.body.status;
  await appointment.save();
  res.json({ success: true, data: await populateAppointment(Appointment.findById(appointment._id)) });
});

exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  if (!["pending", "confirmed"].includes(appointment.status)) {
    res.status(400);
    throw new Error("Only pending or confirmed appointments can be cancelled");
  }

  appointment.status = "cancelled";
  appointment.cancelReason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  await appointment.save();
  res.json({ success: true, data: await populateAppointment(Appointment.findById(appointment._id)) });
});