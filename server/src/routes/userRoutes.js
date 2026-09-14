const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLERS
// =====================================================

const {
    getProfile,
    updateProfile,
    changePassword,
    changeEmail,
    verifyNewEmail,
    changePhone,
    verifyNewPhone,
    deleteAccount,
} = require("../controllers/userController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    profileLimiter,
    otpLimiter,
} = require("../middleware/rateLimitterMiddleware");

// =====================================================
// VALIDATORS
// =====================================================

const {
    updateProfileValidator,
    changePasswordValidator,
    changeEmailValidator,
    changePhoneValidator,
    deleteAccountValidator,
} = require("../validator/profileValidator");

const otpValidator =
    require("../validator/otpValidator");

// =====================================================
// GET PROFILE
// GET /api/user/profile
// =====================================================

router.get(
    "/profile",

    authMiddleware,

    profileLimiter,

    getProfile
);

// =====================================================
// UPDATE PROFILE
// PUT /api/user/profile
// =====================================================

router.put(
    "/profile",

    authMiddleware,

    profileLimiter,

    updateProfileValidator,

    updateProfile
);

// =====================================================
// CHANGE PASSWORD
// PUT /api/user/change-password
// =====================================================

router.put(
    "/change-password",

    authMiddleware,

    profileLimiter,

    changePasswordValidator,

    changePassword
);

// =====================================================
// CHANGE EMAIL
// PUT /api/user/change-email
// =====================================================

router.put(
    "/change-email",

    authMiddleware,

    profileLimiter,

    changeEmailValidator,

    changeEmail
);

// =====================================================
// VERIFY NEW EMAIL
// PUT /api/user/verify-email
// =====================================================

router.put(
    "/verify-email",

    authMiddleware,

    otpLimiter,

    otpValidator,

    verifyNewEmail
);

// =====================================================
// CHANGE PHONE
// PUT /api/user/change-phone
// =====================================================

router.put(
    "/change-phone",

    authMiddleware,

    profileLimiter,

    changePhoneValidator,

    changePhone
);

// =====================================================
// VERIFY NEW PHONE
// PUT /api/user/verify-phone
// =====================================================

router.put(
    "/verify-phone",

    authMiddleware,

    otpLimiter,

    otpValidator,

    verifyNewPhone
);

// =====================================================
// DELETE ACCOUNT
// DELETE /api/user/delete-account
// =====================================================

router.delete(
    "/delete-account",

    authMiddleware,

    profileLimiter,

    deleteAccountValidator,

    deleteAccount
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;