const mongoose = require("mongoose");

const ApiError =
    require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const validateObjectId = (
    value,
    fieldName
) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            value
        )
    ) {
        throw new ApiError(
            400,
            `Invalid ${fieldName}`
        );
    }
};

const validateObjectIdArray = (
    values,
    fieldName
) => {
    if (
        !Array.isArray(values)
    ) {
        throw new ApiError(
            400,
            `${fieldName} must be an array`
        );
    }

    for (const value of values) {
        validateObjectId(
            value,
            fieldName
        );
    }
};

const validateDate = (
    value,
    fieldName
) => {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        throw new ApiError(
            400,
            `Invalid ${fieldName}`
        );
    }

    return date;
};

// =====================================================
// CREATE COUPON
// =====================================================

const validateCreateCoupon = (
    req,
    res,
    next
) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            maximumDiscount,
            minimumOrderAmount,
            usageLimit,
            usageLimitPerUser,
            startDate,
            endDate,
            applicableCategories,
            applicableProducts,
        } = req.body;

        // ---------------------------------------------
        // CODE
        // ---------------------------------------------

        if (
            !code ||
            typeof code !== "string"
        ) {
            throw new ApiError(
                400,
                "Coupon code is required"
            );
        }

        const trimmedCode =
            code.trim();

        if (
            trimmedCode.length < 3 ||
            trimmedCode.length > 50
        ) {
            throw new ApiError(
                400,
                "Coupon code must be between 3 and 50 characters"
            );
        }

        // ---------------------------------------------
        // DISCOUNT TYPE
        // ---------------------------------------------

        if (
            ![
                "percentage",
                "fixed",
            ].includes(
                discountType
            )
        ) {
            throw new ApiError(
                400,
                "Discount type must be percentage or fixed"
            );
        }

        // ---------------------------------------------
        // DISCOUNT VALUE
        // ---------------------------------------------

        if (
            typeof discountValue !==
                "number" ||
            discountValue <= 0
        ) {
            throw new ApiError(
                400,
                "Discount value must be greater than 0"
            );
        }

        if (
            discountType ===
                "percentage" &&
            discountValue > 100
        ) {
            throw new ApiError(
                400,
                "Percentage discount cannot exceed 100"
            );
        }

        // ---------------------------------------------
        // MAXIMUM DISCOUNT
        // ---------------------------------------------

        if (
            maximumDiscount !==
                undefined &&
            maximumDiscount !== null &&
            (
                typeof maximumDiscount !==
                    "number" ||
                maximumDiscount < 0
            )
        ) {
            throw new ApiError(
                400,
                "Maximum discount must be a valid positive number"
            );
        }

        // ---------------------------------------------
        // MINIMUM ORDER AMOUNT
        // ---------------------------------------------

        if (
            minimumOrderAmount !==
                undefined &&
            (
                typeof minimumOrderAmount !==
                    "number" ||
                minimumOrderAmount < 0
            )
        ) {
            throw new ApiError(
                400,
                "Minimum order amount cannot be negative"
            );
        }

        // ---------------------------------------------
        // USAGE LIMIT
        // ---------------------------------------------

        if (
            usageLimit !== undefined &&
            usageLimit !== null &&
            (
                !Number.isInteger(
                    usageLimit
                ) ||
                usageLimit < 1
            )
        ) {
            throw new ApiError(
                400,
                "Usage limit must be at least 1"
            );
        }

        // ---------------------------------------------
        // PER USER LIMIT
        // ---------------------------------------------

        if (
            usageLimitPerUser !==
                undefined &&
            (
                !Number.isInteger(
                    usageLimitPerUser
                ) ||
                usageLimitPerUser < 1
            )
        ) {
            throw new ApiError(
                400,
                "Per-user usage limit must be at least 1"
            );
        }

        // ---------------------------------------------
        // DATES
        // ---------------------------------------------

        if (
            !startDate ||
            !endDate
        ) {
            throw new ApiError(
                400,
                "Start date and end date are required"
            );
        }

        const parsedStartDate =
            validateDate(
                startDate,
                "start date"
            );

        const parsedEndDate =
            validateDate(
                endDate,
                "end date"
            );

        if (
            parsedEndDate <=
            parsedStartDate
        ) {
            throw new ApiError(
                400,
                "End date must be after start date"
            );
        }

        // ---------------------------------------------
        // CATEGORY ARRAY
        // ---------------------------------------------

        if (
            applicableCategories !==
            undefined
        ) {
            validateObjectIdArray(
                applicableCategories,
                "Applicable categories"
            );
        }

        // ---------------------------------------------
        // PRODUCT ARRAY
        // ---------------------------------------------

        if (
            applicableProducts !==
            undefined
        ) {
            validateObjectIdArray(
                applicableProducts,
                "Applicable products"
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// UPDATE COUPON
// =====================================================

const validateUpdateCoupon = (
    req,
    res,
    next
) => {
    try {
        const allowedFields = [
            "code",
            "description",
            "discountType",
            "discountValue",
            "maximumDiscount",
            "minimumOrderAmount",
            "usageLimit",
            "usageLimitPerUser",
            "startDate",
            "endDate",
            "applicableCategories",
            "applicableProducts",
            "isActive",
        ];

        const bodyKeys =
            Object.keys(
                req.body
            );

        if (
            bodyKeys.length === 0
        ) {
            throw new ApiError(
                400,
                "At least one field is required"
            );
        }

        for (const key of bodyKeys) {
            if (
                !allowedFields.includes(
                    key
                )
            ) {
                throw new ApiError(
                    400,
                    `Invalid field: ${key}`
                );
            }
        }

        if (
            req.body.code !==
            undefined
        ) {
            if (
                typeof req.body.code !==
                    "string" ||
                req.body.code.trim().length <
                    3 ||
                req.body.code.trim().length >
                    50
            ) {
                throw new ApiError(
                    400,
                    "Coupon code must be between 3 and 50 characters"
                );
            }
        }

        if (
            req.body.discountType !==
            undefined &&
            ![
                "percentage",
                "fixed",
            ].includes(
                req.body.discountType
            )
        ) {
            throw new ApiError(
                400,
                "Invalid discount type"
            );
        }

        if (
            req.body.discountValue !==
                undefined &&
            (
                typeof req.body
                    .discountValue !==
                    "number" ||
                req.body.discountValue <=
                    0
            )
        ) {
            throw new ApiError(
                400,
                "Discount value must be greater than 0"
            );
        }

        if (
            req.body.maximumDiscount !==
                undefined &&
            req.body.maximumDiscount !==
                null &&
            (
                typeof req.body
                    .maximumDiscount !==
                    "number" ||
                req.body.maximumDiscount <
                    0
            )
        ) {
            throw new ApiError(
                400,
                "Invalid maximum discount"
            );
        }

        if (
            req.body.minimumOrderAmount !==
                undefined &&
            (
                typeof req.body
                    .minimumOrderAmount !==
                    "number" ||
                req.body.minimumOrderAmount <
                    0
            )
        ) {
            throw new ApiError(
                400,
                "Invalid minimum order amount"
            );
        }

        if (
            req.body.usageLimit !==
                undefined &&
            req.body.usageLimit !==
                null &&
            (
                !Number.isInteger(
                    req.body
                        .usageLimit
                ) ||
                req.body.usageLimit <
                    1
            )
        ) {
            throw new ApiError(
                400,
                "Invalid usage limit"
            );
        }

        if (
            req.body
                .usageLimitPerUser !==
                undefined &&
            (
                !Number.isInteger(
                    req.body
                        .usageLimitPerUser
                ) ||
                req.body
                    .usageLimitPerUser <
                    1
            )
        ) {
            throw new ApiError(
                400,
                "Invalid per-user usage limit"
            );
        }

        if (
            req.body
                .applicableCategories !==
                undefined
        ) {
            validateObjectIdArray(
                req.body
                    .applicableCategories,
                "Applicable categories"
            );
        }

        if (
            req.body
                .applicableProducts !==
                undefined
        ) {
            validateObjectIdArray(
                req.body
                    .applicableProducts,
                "Applicable products"
            );
        }

        if (
            req.body.isActive !==
                undefined &&
            typeof req.body.isActive !==
                "boolean"
        ) {
            throw new ApiError(
                400,
                "isActive must be a boolean"
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// COUPON ID
// =====================================================

const validateCouponId = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.couponId,
            "coupon ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// APPLY COUPON
// =====================================================

const validateApplyCoupon = (
    req,
    res,
    next
) => {
    try {
        const {
            code,
        } = req.body;

        if (
            !code ||
            typeof code !== "string"
        ) {
            throw new ApiError(
                400,
                "Coupon code is required"
            );
        }

        if (
            code.trim().length === 0
        ) {
            throw new ApiError(
                400,
                "Coupon code cannot be empty"
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
    validateCreateCoupon,
    validateUpdateCoupon,
    validateCouponId,
    validateApplyCoupon,
};