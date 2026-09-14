const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// CREATE ORDER VALIDATOR
// =====================================================

const validateCreateOrder = (
    req,
    res,
    next
) => {
    const {
        addressId,
        paymentMethod = "cod",
    } = req.body;

    // -------------------------------------------------
    // Address
    // -------------------------------------------------

    if (
        !addressId ||
        !isValidObjectId(addressId)
    ) {
        return next(
            new ApiError(
                400,
                "Valid addressId is required"
            )
        );
    }

    // -------------------------------------------------
    // Payment Method
    // -------------------------------------------------

    if (
        typeof paymentMethod !==
        "string"
    ) {
        return next(
            new ApiError(
                400,
                "Payment method is required"
            )
        );
    }

    const normalizedPaymentMethod =
        paymentMethod
            .trim()
            .toLowerCase();

    if (
        !["cod", "online"].includes(
            normalizedPaymentMethod
        )
    ) {
        return next(
            new ApiError(
                400,
                "Payment method must be either cod or online"
            )
        );
    }

    // Normalize value for controller
    req.body.paymentMethod =
        normalizedPaymentMethod;

    next();
};

// =====================================================
// ORDER ID VALIDATOR
// =====================================================

const validateOrderId = (
    req,
    res,
    next
) => {
    const { orderId } =
        req.params;

    if (
        !orderId ||
        !isValidObjectId(orderId)
    ) {
        return next(
            new ApiError(
                400,
                "Invalid order ID"
            )
        );
    }

    next();
};

// =====================================================
// CANCEL ORDER VALIDATOR
// =====================================================

const validateCancelOrder = (
    req,
    res,
    next
) => {
    const { reason = "" } =
        req.body;

    if (
        reason !== undefined &&
        typeof reason !== "string"
    ) {
        return next(
            new ApiError(
                400,
                "Cancellation reason must be a string"
            )
        );
    }

    if (
        typeof reason === "string" &&
        reason.trim().length > 500
    ) {
        return next(
            new ApiError(
                400,
                "Cancellation reason cannot exceed 500 characters"
            )
        );
    }

    if (
        typeof reason === "string"
    ) {
        req.body.reason =
            reason.trim();
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateCreateOrder,
    validateOrderId,
    validateCancelOrder,
};