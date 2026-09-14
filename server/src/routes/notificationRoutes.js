const express = require("express");

const router = express.Router();

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// =====================================================
// CONTROLLER
// =====================================================

const {
    createNotification,
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllReadNotifications,
} = require("../controllers/notificationController");

// =====================================================
// VALIDATORS
// =====================================================

const {
    validateCreateNotification,
    validateNotificationId,
    validateNotificationQuery,
} = require("../validator/notificationValidator");

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

router.get(
    "/",
    authMiddleware,
    validateNotificationQuery,
    getMyNotifications
);

// =====================================================
// GET UNREAD NOTIFICATION COUNT
// =====================================================

router.get(
    "/unread-count",
    authMiddleware,
    getUnreadNotificationCount
);

// =====================================================
// ADMIN -> USER
// CREATE NOTIFICATION
// =====================================================

router.post(
    "/admin",
    authMiddleware,
    authorizeRoles("admin"),
    validateCreateNotification,
    createNotification
);

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

router.patch(
    "/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);

// =====================================================
// DELETE ALL READ NOTIFICATIONS
// =====================================================

router.delete(
    "/read",
    authMiddleware,
    deleteAllReadNotifications
);

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// =====================================================

router.patch(
    "/:notificationId/read",
    authMiddleware,
    validateNotificationId,
    markNotificationAsRead
);

// =====================================================
// DELETE SINGLE NOTIFICATION
// =====================================================

router.delete(
    "/:notificationId",
    authMiddleware,
    validateNotificationId,
    deleteNotification
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;