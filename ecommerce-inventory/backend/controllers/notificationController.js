const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ok } = require("../utils/apiResponse");

exports.list = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
  ok(res, { items, unread: items.filter((n) => !n.isRead).length });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isRead: true }, { new: true });
  if (!n) throw new ApiError(404, "Notification not found");
  ok(res, n);
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  ok(res, null, "All notifications marked as read");
});
