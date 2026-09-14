const express = require("express");

const router = express.Router();

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    paymentLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

// =====================================================
// VALIDATORS
// =====================================================

const {
    validateCreatePayment,
    validatePaymentVerification,
    validatePaymentId,
} = require(
    "../validator/paymentValidator"
);

// =====================================================
// CONTROLLERS
// =====================================================

const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createCODPayment,
    completeCODPayment,
    getMyPayments,
    getPaymentById,
} = require(
    "../controllers/payment/paymentController"
);

// =====================================================
// RAZORPAY PAYMENT
// =====================================================

// POST /api/payment/create-order

router.post(
    "/create-order",
    paymentLimiter,
    authMiddleware,
    validateCreatePayment,
    createRazorpayOrder
);

// POST /api/payment/verify

router.post(
    "/verify",
    paymentLimiter,
    authMiddleware,
    validatePaymentVerification,
    verifyRazorpayPayment
);

// =====================================================
// CASH ON DELIVERY
// =====================================================

// POST /api/payment/cod

router.post(
    "/cod",
    paymentLimiter,
    authMiddleware,
    validateCreatePayment,
    createCODPayment
);

// PATCH /api/payment/cod/:paymentId/complete

router.patch(
    "/cod/:paymentId/complete",
    paymentLimiter,
    authMiddleware,
    authorizeRoles(
        "admin",
        "seller"
    ),
    validatePaymentId,
    completeCODPayment
);

// =====================================================
// PAYMENT HISTORY
// =====================================================

// GET /api/payment/my-payments

router.get(
    "/my-payments",
    paymentLimiter,
    authMiddleware,
    getMyPayments
);

// GET /api/payment/:paymentId

router.get(
    "/:paymentId",
    paymentLimiter,
    authMiddleware,
    validatePaymentId,
    getPaymentById
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;