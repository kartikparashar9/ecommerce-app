const { body, param, query, validationResult } = require("express-validator");

// =====================================================
// VALIDATION RESULT HANDLER
// =====================================================

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }

    next();
};

// =====================================================
// COMMON VALUES
// =====================================================

const allowedTypes = [
    "general",
    "order",
    "payment",
    "shipping",
    "seller",
    "product",
    "coupon",
    "review",
    "system",
];

const allowedChannels = [
    "in_app",
    "email",
    "both",
];

const allowedRelatedModels = [
    "Order",
    "Product",
    "Seller",
    "Review",
    "Payment",
    "Coupon",
    "User",
];

// =====================================================
// CREATE NOTIFICATION
// ADMIN -> USER
// =====================================================

const validateCreateNotification = [
    body("recipientEmail")
        .trim()
        .notEmpty()
        .withMessage("Recipient email is required")
        .isEmail()
        .withMessage("Please provide a valid recipient email")
        .normalizeEmail(),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Notification title is required")
        .isLength({
            min: 2,
            max: 200,
        })
        .withMessage(
            "Title must be between 2 and 200 characters"
        ),

    body("message")
        .trim()
        .notEmpty()
        .withMessage("Notification message is required")
        .isLength({
            min: 1,
            max: 5000,
        })
        .withMessage(
            "Message must be between 1 and 5000 characters"
        ),

    body("type")
        .optional()
        .trim()
        .isIn(allowedTypes)
        .withMessage("Invalid notification type"),

    body("channel")
        .optional()
        .trim()
        .isIn(allowedChannels)
        .withMessage(
            "Channel must be in_app, email or both"
        ),

    body("relatedId")
        .optional({
            nullable: true,
        })
        .isMongoId()
        .withMessage("Invalid relatedId"),

    body("relatedModel")
        .optional({
            nullable: true,
        })
        .isIn(allowedRelatedModels)
        .withMessage("Invalid relatedModel"),

    handleValidationErrors,
];

// =====================================================
// NOTIFICATION ID
// =====================================================

const validateNotificationId = [
    param("notificationId")
        .isMongoId()
        .withMessage("Invalid notification ID"),

    handleValidationErrors,
];

// =====================================================
// GET NOTIFICATIONS
// =====================================================

const validateNotificationQuery = [
    query("page")
        .optional()
        .isInt({
            min: 1,
        })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({
            min: 1,
            max: 100,
        })
        .withMessage(
            "Limit must be between 1 and 100"
        ),

    query("isRead")
        .optional()
        .isIn([
            "true",
            "false",
        ])
        .withMessage(
            "isRead must be true or false"
        ),

    query("type")
        .optional()
        .isIn(allowedTypes)
        .withMessage("Invalid notification type"),

    handleValidationErrors,
];

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateCreateNotification,
    validateNotificationId,
    validateNotificationQuery,
};