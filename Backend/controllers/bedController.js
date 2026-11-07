
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Bed = require("../models/Bed");
const Ward = require("../models/Ward");

// GET ALL BEDS
exports.getBeds = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  if (req.query.ward) {
    filter.ward = req.query.ward;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const beds = await Bed.find(filter)
    .populate("ward", "name type floor")
    .sort({ bedNumber: 1 });

  res.json({
    success: true,
    count: beds.length,
    data: beds,
  });
});

// GET AVAILABLE BEDS
exports.getAvailableBeds = asyncHandler(async (req, res) => {
  const filter = {
    status: "available",
    isActive: true,
  };

  if (req.query.ward) {
    filter.ward = req.query.ward;
  }

  const beds = await Bed.find(filter)
    .populate("ward", "name type floor")
    .sort({ bedNumber: 1 });

  res.json({
    success: true,
    count: beds.length,
    data: beds,
  });
});

// CREATE ONE OR MULTIPLE BEDS
exports.createBed = asyncHandler(async (req, res) => {
  const { ward, bedNumber, prefix = "B", count } = req.body;

  if (!mongoose.Types.ObjectId.isValid(ward)) {
    res.status(400);
    throw new Error("Valid ward ID is required");
  }

  const existingWard = await Ward.findOne({
    _id: ward,
    isActive: true,
  });

  if (!existingWard) {
    res.status(404);
    throw new Error("Ward not found");
  }

  let numbers = [];

  if (bedNumber) {
    numbers = [bedNumber.trim()];
  } else {
    const total = Number(count);

    if (!Number.isInteger(total) || total < 1 || total > 50) {
      res.status(400);
      throw new Error("Bed count must be between 1 and 50");
    }

    const cleanPrefix = String(prefix).trim() || "B";

    numbers = Array.from(
      { length: total },
      (_, index) => `${cleanPrefix}-${String(index + 1).padStart(2, "0")}`
    );
  }

  const uniqueNumbers = [...new Set(numbers)];

  if (uniqueNumbers.length !== numbers.length) {
    res.status(400);
    throw new Error("Duplicate bed numbers in request");
  }

  const existing = await Bed.find({
    ward,
    bedNumber: { $in: uniqueNumbers },
  }).select("bedNumber");

  if (existing.length) {
    res.status(409);
    throw new Error(
      `These bed numbers already exist: ${existing.map((b) => b.bedNumber).join(", ")}`
    );
  }

  const beds = await Bed.insertMany(
    uniqueNumbers.map((number) => ({
      ward,
      bedNumber: number,
      status: "available",
    }))
  );

  res.status(201).json({
    success: true,
    message: `${beds.length} bed(s) created successfully`,
    count: beds.length,
    data: beds,
  });
});

// UPDATE BED STATUS
exports.updateBedStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["available", "maintenance"].includes(status)) {
    res.status(400);
    throw new Error("Only available or maintenance status can be set manually");
  }

  const bed = await Bed.findOneAndUpdate(
    { _id: req.params.id, isActive: true, status: { $ne: "occupied" } },
    { status },
    { returnDocument: "after", runValidators: true }
  );

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found or currently occupied");
  }

  res.json({
    success: true,
    message: "Bed status updated",
    data: bed,
  });
});

// DELETE BED
exports.deleteBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!bed) {
    res.status(404);
    throw new Error("Bed not found");
  }

  if (bed.status === "occupied") {
    res.status(400);
    throw new Error("Cannot delete an occupied bed");
  }

  bed.isActive = false;
  await bed.save();

  res.json({
    success: true,
    message: "Bed deleted successfully",
  });
});
