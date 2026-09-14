const Notification = require("../models/notificationModel");

// =====================================================
// CREATE NOTIFICATION
// =====================================================

const createNotification =
    async ({
        recipient,

        type = "general",

        title,

        message,

        relatedOrder = null,

        relatedProduct = null,

        relatedPayment = null,

        metadata = {},
    }) => {
        const notification =
            await Notification.create({
                recipient,

                type,

                title,

                message,

                relatedOrder,

                relatedProduct,

                relatedPayment,

                metadata,
            });

        return notification;
    };

// =====================================================
// CREATE MULTIPLE NOTIFICATIONS
// =====================================================

const createManyNotifications =
    async (
        notifications = []
    ) => {
        if (
            !Array.isArray(
                notifications
            ) ||
            notifications.length ===
                0
        ) {
            return [];
        }

        const createdNotifications =
            await Notification.insertMany(
                notifications
            );

        return createdNotifications;
    };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createNotification,

    createManyNotifications,
};