const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

// =====================================================
// OBJECT ID VALIDATOR
// =====================================================

const validateObjectId = (
    value,
    fieldName
) => {
    if (!value) {
        throw new ApiError(
            400,
            `${fieldName} is required`
        );
    }

    if (
        !mongoose.Types.ObjectId.isValid(value)
    ) {
        throw new ApiError(
            400,
            `Invalid ${fieldName}`
        );
    }

    return true;
};

// =====================================================
// GET SHIPPING BY ORDER ID
// =====================================================

const validateOrderId = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.orderId,
            "order ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// CREATE SHIPPING
// =====================================================

const validateCreateShipping = (
    req,
    res,
    next
) => {
    try {
        const {
            orderId,
            carrier,
            trackingNumber,
            trackingUrl,
            estimatedDelivery,
            notes,
        } = req.body;

        validateObjectId(
            orderId,
            "order ID"
        );

        if (
            carrier !== undefined &&
            typeof carrier !== "string"
        ) {
            throw new ApiError(
                400,
                "Carrier must be a string"
            );
        }

        if (
            trackingNumber !== undefined &&
            typeof trackingNumber !== "string"
        ) {
            throw new ApiError(
                400,
                "Tracking number must be a string"
            );
        }

        if (
            trackingUrl !== undefined &&
            typeof trackingUrl !== "string"
        ) {
            throw new ApiError(
                400,
                "Tracking URL must be a string"
            );
        }

        if (
            notes !== undefined &&
            typeof notes !== "string"
        ) {
            throw new ApiError(
                400,
                "Notes must be a string"
            );
        }

        if (
            trackingUrl !== undefined &&
            trackingUrl !== ""
        ) {
            try {
                const url =
                    new URL(trackingUrl);

                if (
                    !["http:", "https:"].includes(
                        url.protocol
                    )
                ) {
                    throw new Error();
                }
            } catch {
                throw new ApiError(
                    400,
                    "Invalid tracking URL"
                );
            }
        }

        if (
            estimatedDelivery !== undefined &&
            estimatedDelivery !== null
        ) {
            const date =
                new Date(
                    estimatedDelivery
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                throw new ApiError(
                    400,
                    "Invalid estimated delivery date"
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// UPDATE SHIPPING
// =====================================================

const validateUpdateShipping = (
    req,
    res,
    next
) => {
    try {
        const {
            carrier,
            trackingNumber,
            trackingUrl,
            estimatedDelivery,
            notes,
        } = req.body;

        if (
            carrier === undefined &&
            trackingNumber === undefined &&
            trackingUrl === undefined &&
            estimatedDelivery === undefined &&
            notes === undefined
        ) {
            throw new ApiError(
                400,
                "At least one shipping field is required"
            );
        }

        if (
            carrier !== undefined &&
            typeof carrier !== "string"
        ) {
            throw new ApiError(
                400,
                "Carrier must be a string"
            );
        }

        if (
            trackingNumber !== undefined &&
            typeof trackingNumber !== "string"
        ) {
            throw new ApiError(
                400,
                "Tracking number must be a string"
            );
        }

        if (
            trackingUrl !== undefined &&
            typeof trackingUrl !== "string"
        ) {
            throw new ApiError(
                400,
                "Tracking URL must be a string"
            );
        }

        if (
            trackingUrl !== undefined &&
            trackingUrl !== ""
        ) {
            try {
                const url =
                    new URL(trackingUrl);

                if (
                    !["http:", "https:"].includes(
                        url.protocol
                    )
                ) {
                    throw new Error();
                }
            } catch {
                throw new ApiError(
                    400,
                    "Invalid tracking URL"
                );
            }
        }

        if (
            notes !== undefined &&
            typeof notes !== "string"
        ) {
            throw new ApiError(
                400,
                "Notes must be a string"
            );
        }

        if (
            estimatedDelivery !== undefined &&
            estimatedDelivery !== null
        ) {
            const date =
                new Date(
                    estimatedDelivery
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                throw new ApiError(
                    400,
                    "Invalid estimated delivery date"
                );
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// SHIPPING STATUS
// =====================================================

const validateShippingStatus = (
    req,
    res,
    next
) => {
    try {
        const { status } =
            req.body;

        const allowedStatuses = [
            "pending",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "returned",
        ];

        if (
            !status ||
            typeof status !== "string"
        ) {
            throw new ApiError(
                400,
                "Shipping status is required"
            );
        }

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            throw new ApiError(
                400,
                "Invalid shipping status"
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateOrderId,
    validateCreateShipping,
    validateUpdateShipping,
    validateShippingStatus,
};