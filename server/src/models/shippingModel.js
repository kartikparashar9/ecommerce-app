const mongoose = require("mongoose");

// =====================================================
// SHIPPING SCHEMA
// =====================================================

const shippingSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // Order Reference
        // -------------------------------------------------

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order is required"],
            unique: true,
            index: true,
        },

        // -------------------------------------------------
        // User Reference
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        // -------------------------------------------------
        // Carrier
        // -------------------------------------------------

        carrier: {
            type: String,
            trim: true,
            maxlength: [
                100,
                "Carrier cannot exceed 100 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Tracking Number
        // -------------------------------------------------

        trackingNumber: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [
                150,
                "Tracking number cannot exceed 150 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Tracking URL
        // -------------------------------------------------

        trackingUrl: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Tracking URL cannot exceed 500 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Shipping Status
        // -------------------------------------------------

        status: {
            type: String,
            enum: {
                values: [
                    "pending",
                    "processing",
                    "shipped",
                    "out_for_delivery",
                    "delivered",
                    "cancelled",
                    "returned",
                ],
                message: "Invalid shipping status",
            },
            default: "pending",
            index: true,
        },

        // -------------------------------------------------
        // Estimated Delivery
        // -------------------------------------------------

        estimatedDelivery: {
            type: Date,
            default: null,
        },

        // -------------------------------------------------
        // Actual Delivery
        // -------------------------------------------------

        deliveredAt: {
            type: Date,
            default: null,
        },

        // -------------------------------------------------
        // Notes
        // -------------------------------------------------

        notes: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Shipping notes cannot exceed 1000 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Cancellation
        // -------------------------------------------------

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Cancellation reason cannot exceed 500 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // Return
        // -------------------------------------------------

        returnedAt: {
            type: Date,
            default: null,
        },

        returnReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Return reason cannot exceed 500 characters",
            ],
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEXES
// =====================================================

shippingSchema.index({
    user: 1,
    createdAt: -1,
});

shippingSchema.index({
    status: 1,
    createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Shipping =
    mongoose.models.Shipping ||
    mongoose.model(
        "Shipping",
        shippingSchema
    );

module.exports = Shipping;