const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPER
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// VALIDATE ORDER ID PARAM
// =====================================================

const validateOrderId = (
    req,
    res,
    next
) => {
    const { orderId } = req.params;

    if (!orderId) {
        return next(
            new ApiError(
                400,
                "Order ID is required"
            )
        );
    }

    if (!isValidObjectId(orderId)) {
        return next(
            new ApiError(
                400,
                "Invalid Order ID"
            )
        );
    }

    next();
};

// =====================================================
// VALIDATE CREATE PAYMENT
// =====================================================

const validateCreatePayment = (
    req,
    res,
    next
) => {
    const { orderId } = req.body;

    if (!orderId) {
        return next(
            new ApiError(
                400,
                "Order ID is required"
            )
        );
    }

    if (
        typeof orderId !== "string" ||
        !isValidObjectId(orderId)
    ) {
        return next(
            new ApiError(
                400,
                "Invalid Order ID"
            )
        );
    }

    next();
};

// =====================================================
// VALIDATE PAYMENT VERIFICATION
// =====================================================

const validatePaymentVerification = (
    req,
    res,
    next
) => {
    const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    if (
        !razorpayOrderId ||
        typeof razorpayOrderId !== "string" ||
        razorpayOrderId.trim().length === 0
    ) {
        return next(
            new ApiError(
                400,
                "Valid Razorpay Order ID is required"
            )
        );
    }

    if (
        !razorpayPaymentId ||
        typeof razorpayPaymentId !== "string" ||
        razorpayPaymentId.trim().length === 0
    ) {
        return next(
            new ApiError(
                400,
                "Valid Razorpay Payment ID is required"
            )
        );
    }

    if (
        !razorpaySignature ||
        typeof razorpaySignature !== "string" ||
        razorpaySignature.trim().length === 0
    ) {
        return next(
            new ApiError(
                400,
                "Valid Razorpay Signature is required"
            )
        );
    }

    next();
};

// =====================================================
// VALIDATE PAYMENT ID
// =====================================================

const validatePaymentId = (
    req,
    res,
    next
) => {
    const { paymentId } = req.params;

    if (!paymentId) {
        return next(
            new ApiError(
                400,
                "Payment ID is required"
            )
        );
    }

    if (!isValidObjectId(paymentId)) {
        return next(
            new ApiError(
                400,
                "Invalid Payment ID"
            )
        );
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateOrderId,
    validateCreatePayment,
    validatePaymentVerification,
    validatePaymentId,
};