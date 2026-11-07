const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const { getPagination, searchRegex, sendPaginated } = require("../utils/apiFeatures");

// GET /api/users?role=&search=&page=&limit=
exports.getUsers = asyncHandler(async (req, res) => {
  const pg = getPagination(req);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [{ name: searchRegex(req.query.search) }, { email: searchRegex(req.query.search) }];
  }
  const [data, total] = await Promise.all([
    User.find(filter).sort("-createdAt").skip(pg.skip).limit(pg.limit),
    User.countDocuments(filter),
  ]);
  sendPaginated(res, data, total, pg);
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

// POST /api/users  (admin creates staff accounts)
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (await User.findOne({ email: (email || "").toLowerCase() })) {
    res.status(400);
    throw new Error("Email already registered");
  }
  const user = await User.create({ name, email, password, phone, role });
  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, phone, role, isActive },
    { returnDocument: "after", runValidators: true, omitUndefined: true }
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

// DELETE /api/users/:id  (deactivates, keeps history intact)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: "after" });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, message: "User deactivated" });
});