const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const tokens = require("../services/tokenService");
const { ok } = require("../utils/apiResponse");

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const sendTokens = async (res, user, status, message) =>
  ok(res, {
    user: publicUser(user),
    accessToken: tokens.signAccessToken(user),
    refreshToken: await tokens.issueRefreshToken(user),
  }, message, status);

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, "Email is already registered");
  const user = await User.create({ name, email, password, role }); // role limited to customer/seller by validator
  await sendTokens(res, user, 201, "Registration successful");
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  // Same message for wrong email or wrong password, so attackers cannot find valid emails
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, "Invalid email or password");
  if (!user.isActive) throw new ApiError(403, "This account is disabled");
  await sendTokens(res, user, 200, "Login successful");
});

exports.refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await tokens.rotateRefreshToken(req.body.refreshToken);
  ok(res, { user: publicUser(user), accessToken, refreshToken }, "Token refreshed");
});

exports.logout = asyncHandler(async (req, res) => {
  await tokens.revokeRefreshToken(req.body.refreshToken);
  ok(res, null, "Logged out successfully");
});

exports.me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));
