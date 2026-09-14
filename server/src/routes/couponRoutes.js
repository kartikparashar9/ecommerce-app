const express = require("express");

const router = express.Router();

const {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    activateCoupon,
    deactivateCoupon,
    applyCoupon,
} = require("../controllers/couponController");

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const authorizeRoles = require(
    "../middleware/roleMiddleware"
);

const {
    couponLimiter,
    adminLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

const {
    validateCreateCoupon,
    validateUpdateCoupon,
    validateCouponId,
    validateApplyCoupon,
} = require(
    "../validator/couponValidator"
);

// =====================================================
// USER ROUTES
// =====================================================

// APPLY COUPON
// POST /api/coupons/apply

router.post(
    "/apply",
    authMiddleware,
    couponLimiter,
    validateApplyCoupon,
    applyCoupon
);

// =====================================================
// ADMIN ROUTES
// =====================================================

router.use(
    authMiddleware,
    adminLimiter,
    authorizeRoles("admin")
);

// CREATE COUPON
// POST /api/coupons

router.post(
    "/",
    validateCreateCoupon,
    createCoupon
);

// GET ALL COUPONS
// GET /api/coupons

router.get(
    "/",
    getAllCoupons
);

// GET SINGLE COUPON
// GET /api/coupons/:couponId

router.get(
    "/:couponId",
    validateCouponId,
    getCouponById
);

// UPDATE COUPON
// PATCH /api/coupons/:couponId

router.patch(
    "/:couponId",
    validateCouponId,
    validateUpdateCoupon,
    updateCoupon
);

// ACTIVATE COUPON
// PATCH /api/coupons/:couponId/activate

router.patch(
    "/:couponId/activate",
    validateCouponId,
    activateCoupon
);

// DEACTIVATE COUPON
// PATCH /api/coupons/:couponId/deactivate

router.patch(
    "/:couponId/deactivate",
    validateCouponId,
    deactivateCoupon
);

// DELETE COUPON
// DELETE /api/coupons/:couponId

router.delete(
    "/:couponId",
    validateCouponId,
    deleteCoupon
);

module.exports = router;