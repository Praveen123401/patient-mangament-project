
const asyncHandler = require("express-async-handler");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");

// CREATE WARD
exports.createWard = asyncHandler(async (req, res) => {
  const { name, type, department, floor, chargePerDay } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Ward name is required");
  }

  const ward = await Ward.create({
    name: name.trim(),
    type: type || "general",
    department: department || null,
    floor: floor ?? 0,
    chargePerDay: chargePerDay ?? 0,
  });

  res.status(201).json({
    success: true,
    message: "Ward created successfully",
    data: ward,
  });
});

// GET ALL WARDS
exports.getWards = asyncHandler(async (req, res) => {
  const wards = await Ward.find({ isActive: true })
    .populate("department", "name")
    .lean();

  const counts = await Bed.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: { ward: "$ward", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);

  wards.forEach((ward) => {
    ward.beds = {
      total: 0,
      available: 0,
      occupied: 0,
      maintenance: 0,
    };

    counts
      .filter((item) => String(item._id.ward) === String(ward._id))
      .forEach((item) => {
        ward.beds[item._id.status] = item.count;
        ward.beds.total += item.count;
      });
  });

  res.json({
    success: true,
    count: wards.length,
    data: wards,
  });
});

exports.getWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate("department", "name");

  if (!ward) {
    res.status(404);
    throw new Error("Ward not found");
  }

  const counts = await Bed.aggregate([
    { $match: { ward: ward._id, isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const beds = {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  };
  counts.forEach(({ _id: status, count }) => {
    beds[status] = count;
    beds.total += count;
  });

  res.json({
    success: true,
    data: { ...ward.toObject(), beds },
  });
});

exports.updateWard = asyncHandler(async (req, res) => {
  const { name, type, department, floor, chargePerDay } = req.body;
  const ward = await Ward.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { name, type, department, floor, chargePerDay },
    { returnDocument: "after", runValidators: true }
  ).populate("department", "name");

  if (!ward) {
    res.status(404);
    throw new Error("Ward not found");
  }

  res.json({ success: true, data: ward });
});

exports.deleteWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { returnDocument: "after" }
  );

  if (!ward) {
    res.status(404);
    throw new Error("Ward not found");
  }

  const occupiedBed = await Bed.exists({
    ward: ward._id,
    isActive: true,
    status: "occupied",
  });

  if (occupiedBed) {
    await Ward.findByIdAndUpdate(ward._id, { isActive: true });
    res.status(400);
    throw new Error("Cannot remove a ward with occupied beds");
  }

  await Bed.updateMany(
    { ward: ward._id, isActive: true },
    { isActive: false }
  );

  res.json({ success: true, message: "Ward deactivated" });
});
