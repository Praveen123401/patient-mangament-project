
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Doctor = require("../models/Doctor");
const User = require("../models/user");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");

// ==========================================
// FORMAT DOCTOR RESPONSE
// ==========================================

function formatDoctor(doctor) {
  const item = doctor.toObject();

  return {
    ...item,

    // Keep MongoDB department ID and name.
    department: item.department
      ? {
          _id: item.department._id,
          name: item.department.name,
        }
      : null,

    name: item.user?.name || "",
    email: item.user?.email || "",
    phone: item.user?.phone || "",
  };
}

// ==========================================
// GET ALL DOCTORS
// ==========================================

exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isActive: true })
    .populate("user", "name email phone")
    .populate("department", "name")
    .sort("-createdAt");

  const formattedDoctors = doctors.map(formatDoctor);

  res.status(200).json({
    success: true,
    count: formattedDoctors.length,
    data: formattedDoctors,
  });
});

// ==========================================
// GET DOCTOR BY ID
// ==========================================

exports.getDoctor = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid doctor ID");
  }

  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  })
    .populate("user", "name email phone")
    .populate("department", "name");

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.status(200).json({
    success: true,
    data: formatDoctor(doctor),
  });
});

// ==========================================
// CREATE NEW DOCTOR
// ==========================================

exports.createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    department,
    qualification,
    experience,
    consultationFee,
  } = req.body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !password ||
    !specialization?.trim() ||
    !department
  ) {
    res.status(400);
    throw new Error(
      "Name, email, password, specialization and department are required"
    );
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  const doctorExperience = Number(experience ?? 0);
  const doctorFee = Number(consultationFee ?? 0);

  if (
    !Number.isFinite(doctorExperience) ||
    doctorExperience < 0 ||
    !Number.isFinite(doctorFee) ||
    doctorFee < 0
  ) {
    res.status(400);
    throw new Error(
      "Experience and consultation fee must be valid non-negative numbers"
    );
  }

  // Resolve department by ID.
  if (!mongoose.Types.ObjectId.isValid(department)) {
    res.status(400);
    throw new Error("Please select a valid department");
  }

  const departmentExists = await Department.findOne({
    _id: department,
    isActive: true,
  });

  if (!departmentExists) {
    res.status(404);
    throw new Error("Department not found or inactive");
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    res.status(409);
    throw new Error("Email is already registered");
  }

  const session = await mongoose.startSession();

  let createdDoctorId;

  try {
    await session.withTransaction(async () => {
      const [newUser] = await User.create(
        [
          {
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone?.trim() || "",
            role: "doctor",
          },
        ],
        { session }
      );

      const [newDoctor] = await Doctor.create(
        [
          {
            user: newUser._id,
            department: departmentExists._id,
            specialization: specialization.trim(),
            qualification: qualification?.trim() || "",
            experience: doctorExperience,
            consultationFee: doctorFee,
          },
        ],
        { session }
      );

      createdDoctorId = newDoctor._id;
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      throw new Error("Email is already registered");
    }

    throw error;
  } finally {
    await session.endSession();
  }

  const doctor = await Doctor.findById(createdDoctorId)
    .populate("user", "name email phone")
    .populate("department", "name");

  res.status(201).json({
    success: true,
    message: "Doctor registered successfully",
    data: formatDoctor(doctor),
  });
});

// ==========================================
// UPDATE DOCTOR
// ==========================================

exports.updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  if (
    req.user.role === "doctor" &&
    doctor.user.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("You can only update your own doctor profile");
  }

  const {
    specialization,
    qualification,
    experience,
    consultationFee,
    department,
  } = req.body;

  const updates = {};

  if (specialization !== undefined) {
    if (
      typeof specialization !== "string" ||
      !specialization.trim()
    ) {
      res.status(400);
      throw new Error("Specialization is required");
    }

    updates.specialization = specialization.trim();
  }

  if (qualification !== undefined) {
    updates.qualification = qualification.trim();
  }

  if (experience !== undefined) {
    const value = Number(experience);

    if (!Number.isFinite(value) || value < 0) {
      res.status(400);
      throw new Error("Invalid experience");
    }

    updates.experience = value;
  }

  if (consultationFee !== undefined) {
    const value = Number(consultationFee);

    if (!Number.isFinite(value) || value < 0) {
      res.status(400);
      throw new Error("Invalid consultation fee");
    }

    updates.consultationFee = value;
  }

  if (department !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      res.status(400);
      throw new Error("Invalid department ID");
    }

    const departmentExists = await Department.findOne({
      _id: department,
      isActive: true,
    });

    if (!departmentExists) {
      res.status(404);
      throw new Error("Department not found or inactive");
    }

    updates.department = departmentExists._id;
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    doctor._id,
    updates,
    {
      returnDocument: "after",
      runValidators: true,
    }
  )
    .populate("user", "name email phone")
    .populate("department", "name");

  res.status(200).json({
    success: true,
    message: "Doctor updated successfully",
    data: formatDoctor(updatedDoctor),
  });
});

// ==========================================
// SET DOCTOR AVAILABILITY
// ==========================================

exports.setAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;

  const validDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!Array.isArray(availability)) {
    res.status(400);
    throw new Error("Availability must be an array");
  }

  const usedDays = new Set();

  for (const item of availability) {
    if (
      !item ||
      !validDays.includes(item.day) ||
      !timeRegex.test(item.startTime || "") ||
      !timeRegex.test(item.endTime || "") ||
      item.startTime >= item.endTime ||
      !Number.isInteger(Number(item.slotDuration)) ||
      Number(item.slotDuration) < 1 ||
      Number(item.slotDuration) > 240
    ) {
      res.status(400);
      throw new Error("Invalid doctor availability schedule");
    }

    if (usedDays.has(item.day)) {
      res.status(400);
      throw new Error(`Duplicate schedule for ${item.day}`);
    }

    usedDays.add(item.day);
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid doctor ID");
  }

  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  if (
    req.user.role === "doctor" &&
    doctor.user.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("You can only update your own availability");
  }

  doctor.availability = availability.map((item) => ({
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    slotDuration: Number(item.slotDuration),
  }));

  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Availability updated successfully",
    data: doctor.availability,
  });
});

// ==========================================
// GET AVAILABLE APPOINTMENT SLOTS
// ==========================================

exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { date: dateValue } = req.query;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid doctor ID");
  }

  if (
    typeof dateValue !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    res.status(400);
    throw new Error("A valid date is required");
  }

  const date = new Date(`${dateValue}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateValue
  ) {
    res.status(400);
    throw new Error("A valid date is required");
  }

  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  const day = date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  const schedules = doctor.availability.filter(
    (schedule) => schedule.day === day
  );

  const available = new Set();

  const dayEnd = new Date(
    date.getTime() + 24 * 60 * 60 * 1000
  );

  const booked = await Appointment.find({
    doctor: doctor._id,
    date: {
      $gte: date,
      $lt: dayEnd,
    },
    status: { $ne: "cancelled" },
  }).distinct("timeSlot");

  const bookedSlots = new Set(booked);

  for (const schedule of schedules) {
    const [startHour, startMinute] =
      schedule.startTime.split(":").map(Number);

    const [endHour, endMinute] =
      schedule.endTime.split(":").map(Number);

    const duration = Number(schedule.slotDuration) || 15;

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    for (
      let minute = start;
      minute + duration <= end;
      minute += duration
    ) {
      const slot =
        `${String(Math.floor(minute / 60)).padStart(2, "0")}:` +
        `${String(minute % 60).padStart(2, "0")}`;

      if (!bookedSlots.has(slot)) {
        available.add(slot);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      day,
      available: [...available].sort(),
    },
  });
});
