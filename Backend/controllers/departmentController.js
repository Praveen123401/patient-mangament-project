const asyncHandler = require("express-async-handler");
const Department = require("../models/Department");

exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .populate({ path: "head", populate: { path: "user", select: "name" } })
    .sort("name");

  res.json({ success: true, count: departments.length, data: departments });
});

exports.getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate({ path: "head", populate: { path: "user", select: "name" } });

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  res.json({ success: true, data: department });
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const { name, description, head } = req.body;
  const department = await Department.create({ name, description, head });
  res.status(201).json({ success: true, data: department });
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const { name, description, head } = req.body;
  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { name, description, head },
    { returnDocument: "after", runValidators: true }
  );

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  res.json({ success: true, data: department });
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { returnDocument: "after" }
  );

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  res.json({ success: true, message: "Department deactivated" });
});
