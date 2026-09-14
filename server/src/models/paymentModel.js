const mongoose = require("mongoose");

// =====================================================
// PAYMENT SCHEMA
// =====================================================

const paymentSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // ORDER
        // -------------------------------------------------

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order is required"],
            index: true,
        },

        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        // -------------------------------------------------
        // PAYMENT AMOUNT
        // -------------------------------------------------

        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
            min: [0, "Payment amount cannot be negative"],
        },

        currency: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            default: "INR",
        },

        // -------------------------------------------------
        // PAYMENT METHOD
        // -------------------------------------------------

        paymentMethod: {
            type: String,
            enum: {
                values: [
                    "cod",
                    "online",
                ],
                message: "Invalid payment method",
            },
            required: true,
        },

        // -------------------------------------------------
        // PAYMENT GATEWAY
        // -------------------------------------------------

        gateway: {
            type: String,
            enum: {
                values: [
                    "razorpay",
                    "cod",
                ],
                message: "Invalid payment gateway",
            },
            required: true,
        },

        // -------------------------------------------------
        // PAYMENT STATUS
        // -------------------------------------------------

        status: {
            type: String,
            enum: {
                values: [
                    "pending",
                    "processing",
                    "success",
                    "failed",
                    "refunded",
                    "partially_refunded",
                ],
                message: "Invalid payment status",
            },
            default: "pending",
            index: true,
        },

        // =================================================
        // RAZORPAY DETAILS
        // =================================================

        razorpayOrderId: {
            type: String,
            trim: true,
            default: "",
        },

        razorpayPaymentId: {
            type: String,
            trim: true,
            default: "",
        },

        // -------------------------------------------------
        // FAILURE DETAILS
        // -------------------------------------------------

        failureReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Failure reason cannot exceed 500 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // PAYMENT SUCCESS TIME
        // -------------------------------------------------

        paidAt: {
            type: Date,
            default: null,
        },

        // =================================================
        // REFUND
        // =================================================

        refundAmount: {
            type: Number,
            default: 0,
            min: [
                0,
                "Refund amount cannot be negative",
            ],
        },

        razorpayRefundId: {
            type: String,
            trim: true,
            default: "",
        },

        refundedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEXES
// =====================================================

// User payment history

paymentSchema.index({
    user: 1,
    createdAt: -1,
});

// Order payment history

paymentSchema.index({
    order: 1,
    createdAt: -1,
});

// Razorpay payment lookup

paymentSchema.index(
    {
        razorpayPaymentId: 1,
    },
    {
        sparse: true,
        unique: true,
    }
);

// Razorpay order lookup

paymentSchema.index(
    {
        razorpayOrderId: 1,
    },
    {
        sparse: true,
        unique: true,
    }
);

// =====================================================
// EXPORT
// =====================================================

// =====================================================
// EXPORT
// =====================================================

const Payment =
    mongoose.models.Payment ||
    mongoose.model(
        "Payment",
        paymentSchema
    );

module.exports = Payment;