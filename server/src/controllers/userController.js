const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const OTP = require("../models/OTPModel");
const { deleteUserCascade } = require("../services/accountDeletionService");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const { generateOTP } = require("../services/OTPService");

const { sendEmailOTP } = require("../services/emailService");

/* =====================================================
   GET PROFILE
===================================================== */

const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Profile fetched successfully"));
});

/* =====================================================
   UPDATE BASIC PROFILE
===================================================== */

const updateProfile = asyncHandler(async (req, res) => {
  const { name, gender, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (gender !== undefined) {
    user.gender = gender;
  }

  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

/* =====================================================
   CHANGE EMAIL
   OTP WILL BE SENT TO NEW EMAIL
===================================================== */

const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;

  if (!newEmail) {
    throw new ApiError(400, "New email is required");
  }

  const email = newEmail.trim().toLowerCase();

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.email.toLowerCase() === email) {
    throw new ApiError(400, "New email cannot be same as current email");
  }

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  await OTP.deleteMany({
    identifier: email,
    type: "email",
    purpose: "changeEmail",
  });

  const otp = generateOTP();

  await OTP.create({
    identifier: email,
    type: "email",
    otp,
    purpose: "changeEmail",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  user.pendingEmail = email;

  await user.save();

  await sendEmailOTP(email, otp);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        email,
      },
      "OTP sent successfully to new email",
    ),
  );
});

/* =====================================================
   VERIFY NEW EMAIL
===================================================== */

const verifyNewEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.pendingEmail) {
    throw new ApiError(400, "No email change request found");
  }

  const otpRecord = await OTP.findOne({
    identifier: user.pendingEmail,
    type: "email",
    purpose: "changeEmail",
  });

  if (!otpRecord) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  const existingUser = await User.findOne({
    email: user.pendingEmail,
    _id: {
      $ne: user._id,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  user.email = user.pendingEmail;

  user.pendingEmail = undefined;

  user.isEmailVerified = true;

  await user.save();

  await OTP.deleteOne({
    _id: otpRecord._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Email changed successfully"));
});

/* =====================================================
   CHANGE PHONE
   OTP WILL BE SENT TO CURRENT EMAIL
===================================================== */

const changePhone = asyncHandler(async (req, res) => {
  const { newPhone } = req.body;

  if (!newPhone) {
    throw new ApiError(400, "New phone number is required");
  }

  const phone = newPhone.trim();

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.phone === phone) {
    throw new ApiError(400, "New phone cannot be same as current phone");
  }

  const existingUser = await User.findOne({
    phone,
  });

  if (existingUser) {
    throw new ApiError(409, "Phone number already exists");
  }

  await OTP.deleteMany({
    identifier: user.email,
    type: "email",
    purpose: "changePhone",
  });

  const otp = generateOTP();

  await OTP.create({
    identifier: user.email,
    type: "email",
    otp,
    purpose: "changePhone",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  user.pendingPhone = phone;

  await user.save();

  await sendEmailOTP(user.email, otp);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        phone,
        email: user.email,
      },
      "OTP sent successfully to your email",
    ),
  );
});

/* =====================================================
   VERIFY NEW PHONE
===================================================== */

const verifyNewPhone = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.pendingPhone) {
    throw new ApiError(400, "No phone change request found");
  }

  const otpRecord = await OTP.findOne({
    identifier: user.email,
    type: "email",
    purpose: "changePhone",
  });

  if (!otpRecord) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  const existingUser = await User.findOne({
    phone: user.pendingPhone,
    _id: {
      $ne: user._id,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Phone number already exists");
  }

  user.phone = user.pendingPhone;

  user.pendingPhone = undefined;

  user.isPhoneVerified = true;

  await user.save();

  await OTP.deleteOne({
    _id: otpRecord._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Phone number changed successfully"));
});

/* =====================================================
   CHANGE PASSWORD
   OTP WILL BE SENT TO CURRENT EMAIL
===================================================== */

const changePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await OTP.deleteMany({
    identifier: user.email,
    type: "email",
    purpose: "changePassword",
  });

  const otp = generateOTP();

  await OTP.create({
    identifier: user.email,
    type: "email",
    otp,
    purpose: "changePassword",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  user.pendingPassword = hashedPassword;

  await user.save();

  await sendEmailOTP(user.email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent successfully to your email"));
});

/* =====================================================
   VERIFY PASSWORD CHANGE
===================================================== */

const verifyPasswordChange = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.pendingPassword) {
    throw new ApiError(400, "No password change request found");
  }

  const otpRecord = await OTP.findOne({
    identifier: user.email,
    type: "email",
    purpose: "changePassword",
  });

  if (!otpRecord) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.password = user.pendingPassword;

  user.pendingPassword = undefined;

  await user.save();

  await OTP.deleteOne({
    _id: otpRecord._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

/* =====================================================
   DELETE ACCOUNT
===================================================== */

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  await deleteUserCascade(user._id);

  res.clearCookie("refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully"));
});

module.exports = {
  getProfile,
  updateProfile,

  changeEmail,
  verifyNewEmail,

  changePhone,
  verifyNewPhone,

  changePassword,
  verifyPasswordChange,

  deleteAccount,
};
