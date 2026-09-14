const mongoose = require("mongoose");

const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

const ApiError = require("../utils/ApiError");

const { sendNotificationEmail } = require("../services/emailService");

// =====================================================
// HELPERS
// =====================================================

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

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

const allowedChannels = ["in_app", "email", "both"];

const isValidType = (type) => allowedTypes.includes(type);

const isValidChannel = (channel) => allowedChannels.includes(channel);

// =====================================================
// SEND EMAIL HELPER
// =====================================================

const sendNotificationEmailIfRequired = async ({
  notification,
  recipient,
  title,
  message,
  type,
  senderName,
}) => {
  const shouldSendEmail =
    notification.channel === "email" || notification.channel === "both";

  if (!shouldSendEmail) {
    return;
  }

  try {
    await sendNotificationEmail({
      to: recipient.email,

      recipientName: recipient.name || "Customer",

      title,

      message,

      type,

      senderName: senderName || "Admin",
    });

    notification.emailStatus = "sent";

    notification.emailSentAt = new Date();

    notification.emailError = null;

    await notification.save();
  } catch (error) {
    notification.emailStatus = "failed";

    notification.emailSentAt = null;

    notification.emailError = error?.message || "Email delivery failed";

    await notification.save();

    console.error("Notification email failed:", error);
  }
};

// =====================================================
// ADMIN -> USER / SELLER
// =====================================================

const createNotification = async (req, res, next) => {
  try {
    // =================================================
    // ADMIN AUTH
    // =================================================

    const adminId = req.user?._id;

    if (!adminId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // =================================================
    // REQUEST BODY
    // =================================================

    const {
      recipientEmail,
      title,
      message,
      type = "general",
      channel = "in_app",
      relatedId = null,
      relatedModel = null,
    } = req.body;

    // =================================================
    // BASIC VALIDATION
    // =================================================

    const normalizedEmail = normalizeEmail(recipientEmail);

    if (!normalizedEmail) {
      return next(new ApiError(400, "Recipient email is required"));
    }

    if (!title || !String(title).trim()) {
      return next(new ApiError(400, "Notification title is required"));
    }

    if (!message || !String(message).trim()) {
      return next(new ApiError(400, "Notification message is required"));
    }

    if (!isValidType(type)) {
      return next(new ApiError(400, "Invalid notification type"));
    }

    if (!isValidChannel(channel)) {
      return next(new ApiError(400, "Invalid notification channel"));
    }

    // =================================================
    // FIND RECIPIENT
    // =================================================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("_id name email role");

    if (!user) {
      return next(new ApiError(404, "No user found with this email address"));
    }

    // =================================================
    // PREVENT ADMIN -> ADMIN
    // =================================================

    if (user.role === "admin") {
      return next(
        new ApiError(400, "Admin notifications cannot be sent using this flow"),
      );
    }

    // =================================================
    // RECIPIENT ROLE
    // =================================================

    const recipientRole = user.role === "seller" ? "seller" : "user";

    // =================================================
    // EMAIL STATUS
    // =================================================

    const shouldSendEmail = channel === "email" || channel === "both";

    const initialEmailStatus = shouldSendEmail ? "pending" : "not_requested";

    // =================================================
    // CREATE NOTIFICATION
    // =================================================

    const notification = await Notification.create({
      recipient: user._id,

      sender: adminId,

      senderRole: "admin",

      recipientRole,

      direction: "admin_to_user",

      channel,

      emailStatus: initialEmailStatus,

      emailSentAt: null,

      emailError: null,

      title: String(title).trim(),

      message: String(message).trim(),

      type,

      relatedId: relatedId || null,

      relatedModel: relatedModel || null,

      isRead: false,

      readAt: null,
    });

    // =================================================
    // EMAIL
    // =================================================

    await sendNotificationEmailIfRequired({
      notification,

      recipient: user,

      title: String(title).trim(),

      message: String(message).trim(),

      type,

      senderName: req.user?.name || "Admin",
    });

    // =================================================
    // RESPONSE
    // =================================================

    const emailFailed =
      shouldSendEmail && notification.emailStatus === "failed";

    return res.status(201).json({
      success: true,

      message: emailFailed
        ? "Website notification created, but email delivery failed"
        : shouldSendEmail
          ? "Notification sent successfully"
          : "Website notification created successfully",

      data: notification,
    });
  } catch (error) {
    console.error("createNotification error:", error);

    return next(error);
  }
};

// =====================================================
// USER / SELLER -> ADMIN
// =====================================================

const createUserToAdminNotification = async (req, res, next) => {
  try {
    // =================================================
    // AUTH
    // =================================================

    const senderId = req.user?._id;

    if (!senderId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // =================================================
    // REQUEST BODY
    // =================================================

    const {
      title,
      message,
      type = "general",
      channel = "in_app",
      relatedId = null,
      relatedModel = null,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!title || !String(title).trim()) {
      return next(new ApiError(400, "Notification title is required"));
    }

    if (!message || !String(message).trim()) {
      return next(new ApiError(400, "Notification message is required"));
    }

    if (!isValidType(type)) {
      return next(new ApiError(400, "Invalid notification type"));
    }

    if (!isValidChannel(channel)) {
      return next(new ApiError(400, "Invalid notification channel"));
    }

    // =================================================
    // FIND SENDER
    // =================================================

    const sender = await User.findById(senderId).select("_id name email role");

    if (!sender) {
      return next(new ApiError(404, "Sender account not found"));
    }

    // =================================================
    // ONLY USER / SELLER CAN USE THIS FLOW
    // =================================================

    if (sender.role !== "user" && sender.role !== "seller") {
      return next(
        new ApiError(
          403,
          "Only users and sellers can send notifications to admin",
        ),
      );
    }

    // =================================================
    // FIND PRIMARY ADMIN
    // =================================================

    const admin = await User.findOne({
      role: "admin",
    })
      .sort({
        createdAt: 1,
      })
      .select("_id name email role");

    if (!admin) {
      return next(new ApiError(404, "No admin account is available"));
    }

    // =================================================
    // EMAIL STATUS
    // =================================================

    const shouldSendEmail = channel === "email" || channel === "both";

    const initialEmailStatus = shouldSendEmail ? "pending" : "not_requested";

    // =================================================
    // CREATE ADMIN NOTIFICATION
    // =================================================

    const notification = await Notification.create({
      recipient: admin._id,

      sender: sender._id,

      senderRole: sender.role,

      recipientRole: "admin",

      direction: "user_to_admin",

      channel,

      emailStatus: initialEmailStatus,

      emailSentAt: null,

      emailError: null,

      title: String(title).trim(),

      message: String(message).trim(),

      type,

      relatedId: relatedId || null,

      relatedModel: relatedModel || null,

      isRead: false,

      readAt: null,
    });

    // =================================================
    // EMAIL TO ADMIN
    // =================================================

    await sendNotificationEmailIfRequired({
      notification,

      recipient: admin,

      title: String(title).trim(),

      message: String(message).trim(),

      type,

      senderName: sender.name || (sender.role === "seller" ? "Seller" : "User"),
    });

    // =================================================
    // RESPONSE
    // =================================================

    const emailFailed =
      shouldSendEmail && notification.emailStatus === "failed";

    return res.status(201).json({
      success: true,

      message: emailFailed
        ? "Website notification sent to admin, but email delivery failed"
        : shouldSendEmail
          ? "Notification sent to admin successfully"
          : "Website notification sent to admin successfully",

      data: notification,
    });
  } catch (error) {
    console.error("createUserToAdminNotification error:", error);

    return next(error);
  }
};

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // =================================================
    // PAGINATION
    // =================================================

    let page = Number(req.query.page) || 1;

    let limit = Number(req.query.limit) || 20;

    page = Math.max(1, Math.floor(page));

    limit = Math.min(100, Math.max(1, Math.floor(limit)));

    const skip = (page - 1) * limit;

    // =================================================
    // FILTER
    // =================================================

    const filter = {
      recipient: userId,
    };

    // =================================================
    // READ FILTER
    // =================================================

    if (req.query.isRead !== undefined) {
      if (req.query.isRead === "true") {
        filter.isRead = true;
      } else if (req.query.isRead === "false") {
        filter.isRead = false;
      } else {
        return next(new ApiError(400, "isRead must be true or false"));
      }
    }

    // =================================================
    // TYPE FILTER
    // =================================================

    if (req.query.type) {
      if (!isValidType(req.query.type)) {
        return next(new ApiError(400, "Invalid notification type"));
      }

      filter.type = req.query.type;
    }

    // =================================================
    // DATABASE
    // =================================================

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("sender", "name email role avatar")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        recipient: userId,

        isRead: false,
      }),
    ]);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message: "Notifications fetched successfully",

      data: {
        notifications,

        unreadCount,

        pagination: {
          total,

          page,

          limit,

          totalPages: Math.ceil(total / limit),

          hasNextPage: page * limit < total,

          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET UNREAD COUNT
// =====================================================

const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,

      isRead: false,
    });

    return res.status(200).json({
      success: true,

      message: "Unread notification count fetched successfully",

      data: {
        unreadCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// MARK SINGLE AS READ
// =====================================================

const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { notificationId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return next(new ApiError(400, "Invalid notification ID"));
    }

    const notification = await Notification.findOne({
      _id: notificationId,

      recipient: userId,
    });

    if (!notification) {
      return next(new ApiError(404, "Notification not found"));
    }

    if (!notification.isRead) {
      notification.isRead = true;

      notification.readAt = new Date();

      await notification.save();
    }

    return res.status(200).json({
      success: true,

      message: "Notification marked as read",

      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// MARK ALL AS READ
// =====================================================

const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const result = await Notification.updateMany(
      {
        recipient: userId,

        isRead: false,
      },
      {
        $set: {
          isRead: true,

          readAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,

      message: "All notifications marked as read",

      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// DELETE SINGLE NOTIFICATION
// =====================================================

const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { notificationId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return next(new ApiError(400, "Invalid notification ID"));
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,

      recipient: userId,
    });

    if (!notification) {
      return next(new ApiError(404, "Notification not found"));
    }

    return res.status(200).json({
      success: true,

      message: "Notification deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// DELETE ALL READ NOTIFICATIONS
// =====================================================

const deleteAllReadNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const result = await Notification.deleteMany({
      recipient: userId,

      isRead: true,
    });

    return res.status(200).json({
      success: true,

      message: "Read notifications deleted successfully",

      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createNotification,
  createUserToAdminNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
};
