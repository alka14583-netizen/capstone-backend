// Every successful response has the same shape: { success, message, data }
exports.ok = (res, data = null, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });
