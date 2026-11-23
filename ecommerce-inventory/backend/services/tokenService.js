const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

exports.signAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  });

exports.issueRefreshToken = async (user) => {
  const token = jwt.sign({ id: user.id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  await RefreshToken.create({ user: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
  return token;
};

// Refresh token ROTATION: each refresh token can be used only once.
exports.rotateRefreshToken = async (token) => {
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
  catch (e) { throw new ApiError(401, "Invalid or expired refresh token"); }

  const record = await RefreshToken.findOne({ tokenHash: hash(token) });
  if (!record || record.revoked) {
    // A used/unknown token came back: possible theft, so log the user out everywhere.
    await RefreshToken.updateMany({ user: payload.id }, { revoked: true });
    throw new ApiError(401, "Refresh token is no longer valid. Please log in again");
  }
  record.revoked = true;
  await record.save();

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, "User no longer exists or is disabled");
  return { user, accessToken: exports.signAccessToken(user), refreshToken: await exports.issueRefreshToken(user) };
};

exports.revokeRefreshToken = (token) => RefreshToken.updateOne({ tokenHash: hash(token) }, { revoked: true });
