const Notification = require("../models/Notification");

// Never let a notification failure break the main request
const notify = async (user, title, message, type = "general") => {
  if (!user) return;
  try {
    await Notification.create({ user, title, message, type });
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
};

module.exports = notify;