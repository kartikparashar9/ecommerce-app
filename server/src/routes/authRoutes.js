const express = require("express");
const router = express.Router();

const {
    signup,
    verifySignupOTP,
    resendOTP,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    googleLogin
} = require("../controllers/authController.js");

const signupValidator = require("../validator/signupValidator.js");
const signupOTPValidator = require("../validator/otpValidator.js");
const loginValidator = require("../validator/loginValidator.js");
const forgotPasswordValidator = require("../validator/forgetPasswordValidator.js");
const resetPasswordValidator = require("../validator/resetPasswordValidator.js");

const {
    loginLimiter,
    otpLimiter,
    signupLimiter
} = require("../middleware/rateLimitterMiddleware.js");

const loginAttemptLimit = require("../middleware/loginAttemptMiddleware.js");
const otpAttemptLimit = require("../middleware/otpAttemptMiddleware.js");

router.post(
    "/signup",
    signupLimiter,
    signupValidator,
    signup
);

router.post(
    "/verify-otp",
    otpAttemptLimit,
    otpLimiter,
    signupOTPValidator,
    verifySignupOTP
);

router.post(
    "/resend-otp",
    otpAttemptLimit,
    otpLimiter,
    resendOTP
);

router.post(
    "/login",
    loginAttemptLimit,
    loginLimiter,
    loginValidator,
    login
);

router.post(
    "/refresh-token",
    refreshToken
);

router.post(
    "/logout",
    logout
);

router.post(
    "/forgot-password",
    forgotPasswordValidator,
    forgotPassword
);

router.post(
    "/reset-password",
    resetPasswordValidator,
    resetPassword
);

router.post(
    "/google-login",
    googleLogin
);

module.exports = router;