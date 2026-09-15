const User = require("../models/userModel");
const OTP = require("../models/OTPModel");
const bcrypt = require("bcrypt");

const { createOTP, verifyOTP } = require("../services/OTPService");
const { sendEmailOTP } = require("../services/emailService");

const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const PendingUser = require("../models/pendingUserModel");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const {
  increaseLoginAttempt,
  resetLoginAttempt,
} = require("../services/loginAttemptService");

const {
  increaseOTPAttempt,
  resetOTPAttempt,
} = require("../services/otpAttemptService");

const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gender, role } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  await PendingUser.deleteMany({
    $or: [{ email }, { phone }],
  });

  await OTP.deleteMany({
    identifier: email,
    purpose: "signup",
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const avatar =
    gender === "male"
      ? "/avatars/male-avatar.jpg"
      : "/avatars/female-avatar.jpg";

  await PendingUser.create({
    name,
    email,
    phone,
    password: hashedPassword,
    gender,
    avatar,
    role,
  });

  const emailOTP = await createOTP(email, "email", "signup");

  await sendEmailOTP({
    to: email,
    otp: emailOTP.otp,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Email verification OTP sent successfully"));
});

const verifySignupOTP = asyncHandler(async (req, res) => {
  const { email, emailOTP } = req.body;

  const pendingUser = await PendingUser.findOne({
    email,
  });

  if (!pendingUser) {
    throw new ApiError(404, "Signup session expired. Please signup again.");
  }

  try {
    await verifyOTP(email, "email", "signup", emailOTP);

    resetOTPAttempt(email);
  } catch (error) {
    increaseOTPAttempt(email);
    throw error;
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone: pendingUser.phone }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    phone: pendingUser.phone,
    password: pendingUser.password,
    gender: pendingUser.gender,
    avatar: pendingUser.avatar,
    role: pendingUser.role,
    isEmailVerified: true,
    isPhoneVerified: false,
  });

  await PendingUser.deleteOne({
    _id: pendingUser._id,
  });

  await OTP.deleteMany({
    identifier: email,
    purpose: "signup",
  });

  const accessToken = generateAccessToken(user._id);

  const refreshToken = generateRefreshToken(user._id);

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(201, "Account created successfully", {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          avatar: user.avatar,
          role: user.role,
          isBlocked: user.isBlocked,
        },
      }),
    );
});

const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const pendingUser = await PendingUser.findOne({
    email,
  });

  if (!pendingUser) {
    throw new ApiError(404, "Signup session expired. Please signup again.");
  }

  await OTP.deleteMany({
    identifier: email,
    purpose: "signup",
  });

  const emailOTP = await createOTP(email, "email", "signup");

  await sendEmailOTP(email, emailOTP.otp);

  return res
    .status(200)
    .json(new ApiResponse(200, "Email OTP resent successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  const query = {};

  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone;
  } else {
    throw new ApiError(400, "Email or phone number is required");
  }

  const user = await User.findOne(query);

  if (!user) {
    increaseLoginAttempt(email || phone);

    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "Account has been deleted");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    increaseLoginAttempt(user.email);

    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user._id);

  const refreshToken = generateRefreshToken(user._id);

  user.lastLogin = new Date();

  await user.save();

  resetLoginAttempt(user.email);

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "Login successful", {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
        },
      }),
    );
});

const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "Account has been deleted");
  }

  const accessToken = generateAccessToken(user._id);

  return res.status(200).json(
    new ApiResponse(200, "Access token generated successfully", {
      accessToken,
    }),
  );
});

const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json(new ApiResponse(200, "Logout successful"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "Account has been deleted");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  await OTP.deleteMany({
    identifier: email,
    purpose: "forgotPassword",
  });

  const emailOTP = await createOTP(email, "email", "forgotPassword");

  await sendEmailOTP(email, emailOTP.otp);

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset OTP sent successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "Account has been deleted");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  await verifyOTP(email, "email", "forgotPassword", otp);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  await user.save();

  await OTP.deleteMany({
    identifier: email,
    purpose: "forgotPassword",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successful"));
});

const googleLogin = asyncHandler(async (req, res) => {
  const { token, gender } = req.body;

  if (!["male", "female"].includes(gender)) {
    throw new ApiError(400, "Gender must be male or female");
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  let user = await User.findOne({
    email: payload.email,
  });

  if (user && user.isDeleted) {
    throw new ApiError(403, "Account has been deleted");
  }

  if (user && user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  if (!user) {
    const avatar =
      gender === "male" ? "/avatars/male.png" : "/avatars/female.png";

    user = await User.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
      gender,
      avatar,
      isEmailVerified: true,
    });
  }

  const accessToken = generateAccessToken(user._id);

  const refreshToken = generateRefreshToken(user._id);

  user.lastLogin = new Date();

  await user.save();

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(200, "Google login successful", {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          avatar: user.avatar,
          role: user.role,
        },
      }),
    );
});

module.exports = {
  signup,
  verifySignupOTP,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
};
