const mongoose = require("mongoose");

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // COUPON CODE
        // -------------------------------------------------

        code: {
            type: String,
            required: [
                true,
                "Coupon code is required",
            ],
            trim: true,
            uppercase: true,
            unique: true,
            maxlength: [
                50,
                "Coupon code cannot exceed 50 characters",
            ],
        },

        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        description: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Description cannot exceed 500 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // DISCOUNT TYPE
        // -------------------------------------------------

        discountType: {
            type: String,
            enum: {
                values: [
                    "percentage",
                    "fixed",
                ],
                message:
                    "Discount type must be percentage or fixed",
            },
            required: true,
        },

        // -------------------------------------------------
        // DISCOUNT VALUE
        // -------------------------------------------------

        discountValue: {
            type: Number,
            required: [
                true,
                "Discount value is required",
            ],
            min: [
                0,
                "Discount value cannot be negative",
            ],
        },

        // -------------------------------------------------
        // MAXIMUM DISCOUNT
        // -------------------------------------------------

        maximumDiscount: {
            type: Number,
            default: null,
            min: [
                0,
                "Maximum discount cannot be negative",
            ],
        },

        // -------------------------------------------------
        // MINIMUM ORDER AMOUNT
        // -------------------------------------------------

        minimumOrderAmount: {
            type: Number,
            default: 0,
            min: [
                0,
                "Minimum order amount cannot be negative",
            ],
        },

        // -------------------------------------------------
        // USAGE LIMIT
        // -------------------------------------------------

        usageLimit: {
            type: Number,
            default: null,
            min: [
                1,
                "Usage limit must be at least 1",
            ],
        },

        // -------------------------------------------------
        // USED COUNT
        // -------------------------------------------------

        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // -------------------------------------------------
        // PER USER USAGE LIMIT
        // -------------------------------------------------

        usageLimitPerUser: {
            type: Number,
            default: 1,
            min: [
                1,
                "Per-user usage limit must be at least 1",
            ],
        },

        // -------------------------------------------------
        // VALIDITY
        // -------------------------------------------------

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        // -------------------------------------------------
        // APPLICABLE CATEGORIES
        // Empty = applicable to all categories
        // -------------------------------------------------

        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],

        // -------------------------------------------------
        // APPLICABLE PRODUCTS
        // Empty = applicable to all products
        // -------------------------------------------------

        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],

        // -------------------------------------------------
        // ACTIVE STATUS
        // -------------------------------------------------

        isActive: {
            type: Boolean,
            default: true,
        },

        // -------------------------------------------------
        // CREATED BY ADMIN
        // -------------------------------------------------

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// VALIDATE DATES
// =====================================================

couponSchema.pre(
    "validate",
    function (next) {
        if (
            this.startDate &&
            this.endDate &&
            this.endDate <= this.startDate
        ) {
            return next(
                new Error(
                    "End date must be after start date"
                )
            );
        }

        next();
    }
);

// =====================================================
// INDEXES
// =====================================================

// code index unique:true automatically creates it.
// Do NOT create couponSchema.index({ code: 1 }).

couponSchema.index({
    isActive: 1,
    startDate: 1,
    endDate: 1,
});

// =====================================================
// EXPORT
// =====================================================

const Coupon =
    mongoose.models.Coupon ||
    mongoose.model(
        "Coupon",
        couponSchema
    );

module.exports = Coupon;