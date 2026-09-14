const mongoose = require("mongoose");

// =====================================================
// CONSTANTS
// =====================================================

const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
];

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// ORDER ID VALIDATOR
// =====================================================

const validateOrderId = (
    req,
    res,
    next
) => {
    const {
        orderId,
    } = req.params;

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message:
                "Order ID is required",
        });
    }

    if (
        !isValidObjectId(orderId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid order ID",
        });
    }

    next();
};

// =====================================================
// STATUS VALIDATOR
// =====================================================

const validateOrderStatus = (
    req,
    res,
    next
) => {
    const {
        status,
    } = req.body;

    if (
        status === undefined ||
        status === null ||
        status === ""
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Order status is required",
        });
    }

    if (
        typeof status !==
        "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Order status must be a string",
        });
    }

    const normalizedStatus =
        status
            .trim()
            .toLowerCase();

    if (
        !ORDER_STATUSES.includes(
            normalizedStatus
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid order status",
        });
    }

    req.body.status =
        normalizedStatus;

    next();
};

// =====================================================
// CANCEL VALIDATOR
// =====================================================

const validateCancelOrder = (
    req,
    res,
    next
) => {
    const {
        cancellationReason,
    } = req.body;

    if (
        cancellationReason !==
            undefined &&
        typeof cancellationReason !==
            "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Cancellation reason must be a string",
        });
    }

    if (
        typeof cancellationReason ===
            "string" &&
        cancellationReason.trim()
            .length > 500
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Cancellation reason cannot exceed 500 characters",
        });
    }

    next();
};

// =====================================================
// QUERY VALIDATOR
// =====================================================

const validateAdminOrderQuery = (
    req,
    res,
    next
) => {
    const {
        status,
        page,
        limit,
        seller,
        user,
    } = req.query;

    // -------------------------------------------------
    // Status
    // -------------------------------------------------

    if (
        status !== undefined &&
        !ORDER_STATUSES.includes(
            String(status)
                .trim()
                .toLowerCase()
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid order status",
        });
    }

    // -------------------------------------------------
    // Page
    // -------------------------------------------------

    if (
        page !== undefined &&
        (
            !/^\d+$/.test(
                String(page)
            ) ||
            Number(page) < 1
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Page must be a positive integer",
        });
    }

    // -------------------------------------------------
    // Limit
    // -------------------------------------------------

    if (
        limit !== undefined &&
        (
            !/^\d+$/.test(
                String(limit)
            ) ||
            Number(limit) < 1 ||
            Number(limit) > 100
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Limit must be between 1 and 100",
        });
    }

    // -------------------------------------------------
    // Seller ID
    // -------------------------------------------------

    if (
        seller !== undefined &&
        !isValidObjectId(seller)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid seller ID",
        });
    }

    // -------------------------------------------------
    // User ID
    // -------------------------------------------------

    if (
        user !== undefined &&
        !isValidObjectId(user)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid user ID",
        });
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateOrderId,
    validateOrderStatus,
    validateCancelOrder,
    validateAdminOrderQuery,
};