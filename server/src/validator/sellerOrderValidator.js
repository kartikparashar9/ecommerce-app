const mongoose = require("mongoose");

// =====================================================
// CONSTANTS
// =====================================================

const SELLER_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
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

const validateSellerOrderId = (
    req,
    res,
    next
) => {
    const { orderId } =
        req.params;

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
// UPDATE STATUS VALIDATOR
// =====================================================

const validateSellerOrderStatus = (
    req,
    res,
    next
) => {
    const { status } =
        req.body;

    // -------------------------------------------------
    // Required
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Type
    // -------------------------------------------------

    if (
        typeof status !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Order status must be a string",
        });
    }

    // -------------------------------------------------
    // Normalize
    // -------------------------------------------------

    const normalizedStatus =
        status
            .trim()
            .toLowerCase();

    // -------------------------------------------------
    // Allowed Status
    // -------------------------------------------------

    if (
        !SELLER_STATUSES.includes(
            normalizedStatus
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid seller order status",
        });
    }

    // -------------------------------------------------
    // Normalize Request
    // -------------------------------------------------

    req.body.status =
        normalizedStatus;

    next();
};

// =====================================================
// LIST QUERY VALIDATOR
// =====================================================

const validateSellerOrderQuery = (
    req,
    res,
    next
) => {
    const {
        status,
        page,
        limit,
    } = req.query;

    // -------------------------------------------------
    // Status
    // -------------------------------------------------

    if (
        status !== undefined &&
        !SELLER_STATUSES.includes(
            String(status).toLowerCase()
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
            Number(limit) > 50
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Limit must be between 1 and 50",
        });
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateSellerOrderId,
    validateSellerOrderStatus,
    validateSellerOrderQuery,
};