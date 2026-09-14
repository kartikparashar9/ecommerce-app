const mongoose = require("mongoose");

// =====================================================
// NOTIFICATION MODEL
// =====================================================

const notificationSchema = new mongoose.Schema(
    {
        // =================================================
        // RECIPIENT
        // =================================================

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // =================================================
        // SENDER
        // =================================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        senderRole: {
            type: String,
            enum: [
                "user",
                "admin",
                "seller",
                "system",
            ],
            default: "system",
        },

        recipientRole: {
            type: String,
            enum: [
                "user",
                "admin",
                "seller",
                "system",
            ],
            default: "user",
        },

        // =================================================
        // DIRECTION
        // =================================================

        direction: {
            type: String,
            enum: [
                "admin_to_user",
                "user_to_admin",
                "seller_to_admin",
                "system_to_user",
                "system_to_admin",
            ],
            default: "system_to_user",
            index: true,
        },

        // =================================================
        // DELIVERY CHANNEL
        // =================================================

        channel: {
            type: String,
            enum: [
                "in_app",
                "email",
                "both",
            ],
            default: "in_app",
        },

        // =================================================
        // EMAIL STATUS
        // =================================================

        emailStatus: {
            type: String,
            enum: [
                "not_requested",
                "pending",
                "sent",
                "failed",
            ],
            default: "not_requested",
        },

        emailSentAt: {
            type: Date,
            default: null,
        },

        emailError: {
            type: String,
            default: null,
        },

        // =================================================
        // NOTIFICATION CONTENT
        // =================================================

        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 5000,
        },

        // =================================================
        // TYPE
        // =================================================

        type: {
            type: String,
            enum: [
                "general",
                "order",
                "payment",
                "shipping",
                "seller",
                "product",
                "coupon",
                "review",
                "system",
            ],
            default: "general",
            index: true,
        },

        // =================================================
        // OPTIONAL RELATED RESOURCE
        // =================================================

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        relatedModel: {
            type: String,
            enum: [
                "Order",
                "Product",
                "Seller",
                "Review",
                "Payment",
                "Coupon",
                "User",
                null,
            ],
            default: null,
        },

        // =================================================
        // READ STATUS
        // =================================================

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
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

notificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipient: 1,
    type: 1,
    createdAt: -1,
});

notificationSchema.index({
    direction: 1,
    createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

module.exports = Notification;