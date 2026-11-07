const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const User = require("../models/user");

// GET /api/notifications?unread=true
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;
  const [data, unreadCount] = await Promise.all([
    Notification.find(filter).sort("-createdAt").limit(50),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, unreadCount, data });
});

// POST /api/notifications   (admin)  body: { user | role, title, message, type }
exports.createNotification = asyncHandler(async (req, res) => {
  const { user, role, title, message, type } = req.body;
  let targets = [];
  if (user) targets = [user];
  else if (role) targets = (await User.find({ role, isActive: true }).select("_id")).map((u) => u._id);
  if (!targets.length) {
    res.status(400);
    throw new Error("Provide a user or a role with active users");
  }
  await Notification.insertMany(targets.map((u) => ({ user: u, title, message, type })));
  res.status(201).json({ success: true, sent: targets.length });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { returnDocument: "after" }
  );
  if (!n) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, data: n });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, message: "Deleted" });
});