const mongoose = require("mongoose");

const Order = require("../../models/orderModel");
const ApiError = require("../../utils/ApiError");

// =====================================================
// CONSTANTS
// =====================================================

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// GET ALL ORDERS
// =====================================================

// GET /api/admin/orders

const getAllOrders = async (req, res, next) => {
  try {
    // -------------------------------------------------
    // Query Parameters
    // -------------------------------------------------

    const {
      status,
      paymentStatus,
      seller,
      user,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const skip = (currentPage - 1) * perPage;

    // -------------------------------------------------
    // Filter
    // -------------------------------------------------

    const filter = {};

    // -------------------------------------------------
    // Order Status
    // -------------------------------------------------

    if (status) {
      const normalizedStatus = String(status).trim().toLowerCase();

      if (!ORDER_STATUSES.includes(normalizedStatus)) {
        return next(new ApiError(400, "Invalid order status"));
      }

      filter.orderStatus = normalizedStatus;
    }

    // -------------------------------------------------
    // Payment Status
    // -------------------------------------------------

    if (paymentStatus) {
      filter.paymentStatus = String(paymentStatus).trim().toLowerCase();
    }

    // -------------------------------------------------
    // Seller Filter
    // -------------------------------------------------

    if (seller) {
      if (!isValidObjectId(seller)) {
        return next(new ApiError(400, "Invalid seller ID"));
      }

      // Order.items.seller stores Seller._id
      filter["items.seller"] = seller;
    }

    // -------------------------------------------------
    // User Filter
    // -------------------------------------------------

    if (user) {
      if (!isValidObjectId(user)) {
        return next(new ApiError(400, "Invalid user ID"));
      }

      filter.user = user;
    }

    // -------------------------------------------------
    // Search
    // -------------------------------------------------

    if (search) {
      const searchRegex = new RegExp(String(search).trim(), "i");

      filter.$or = [
        {
          orderNumber: searchRegex,
        },
      ];
    }

    // -------------------------------------------------
    // Fetch Orders
    // -------------------------------------------------

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate({
          path: "user",
          select: "name email phone",
        })
        .populate({
          path: "items.product",
          select: "name slug",
        })
        .populate({
          // Order.items.seller → Seller._id
          path: "items.seller",
          select: "businessName businessEmail businessPhone verificationStatus",
          populate: {
            // Seller.user → User._id
            path: "user",
            select: "name email phone avatar",
          },
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Order.countDocuments(filter),
    ]);

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const totalPages = Math.ceil(totalOrders / perPage);

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Orders fetched successfully",

      data: orders,

      pagination: {
        currentPage,
        limit: perPage,
        totalOrders,
        totalPages,

        hasNextPage: currentPage < totalPages,

        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET ORDER BY ID
// =====================================================

// GET /api/admin/orders/:orderId

const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // -------------------------------------------------
    // Validate ID
    // -------------------------------------------------

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    // -------------------------------------------------
    // Find Order
    // -------------------------------------------------

    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .populate({
        // Order.items.seller → Seller._id
        path: "items.seller",
        select: "businessName businessEmail businessPhone verificationStatus",
        populate: {
          // Seller.user → User._id
          path: "user",
          select: "name email phone avatar",
        },
      })
      .lean();

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Order fetched successfully",

      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

// PATCH /api/admin/orders/:orderId/status

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { status } = req.body;

    // -------------------------------------------------
    // Validate Order ID
    // -------------------------------------------------

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    // -------------------------------------------------
    // Validate Status
    // -------------------------------------------------

    if (typeof status !== "string") {
      return next(new ApiError(400, "Order status is required"));
    }

    const newStatus = status.trim().toLowerCase();

    if (!ORDER_STATUSES.includes(newStatus)) {
      return next(new ApiError(400, "Invalid order status"));
    }

    // -------------------------------------------------
    // Find Order
    // -------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // -------------------------------------------------
    // Same Status
    // -------------------------------------------------

    if (order.orderStatus === newStatus) {
      return next(new ApiError(400, `Order is already ${newStatus}`));
    }

    // -------------------------------------------------
    // Prevent Invalid Terminal Updates
    // -------------------------------------------------

    if (
      ["delivered", "returned", "refunded"].includes(order.orderStatus) &&
      !["returned", "refunded"].includes(newStatus)
    ) {
      return next(
        new ApiError(
          400,
          `Order cannot move from ${order.orderStatus} to ${newStatus}`,
        ),
      );
    }

    // -------------------------------------------------
    // Cancelled Order
    // -------------------------------------------------

    if (order.orderStatus === "cancelled" && newStatus !== "refunded") {
      return next(
        new ApiError(400, "Cancelled order cannot be moved to this status"),
      );
    }

    // -------------------------------------------------
    // Update Status
    // -------------------------------------------------

    order.orderStatus = newStatus;

    // -------------------------------------------------
    // Delivered Date
    // -------------------------------------------------

    if (newStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    // -------------------------------------------------
    // Cancelled Date
    // -------------------------------------------------

    if (newStatus === "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    // -------------------------------------------------
    // Fetch Updated Order
    // -------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .populate({
        // Order.items.seller → Seller._id
        path: "items.seller",
        select: "businessName businessEmail businessPhone verificationStatus",
        populate: {
          // Seller.user → User._id
          path: "user",
          select: "name email phone avatar",
        },
      })
      .lean();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Order status updated successfully",

      data: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// CANCEL ORDER
// =====================================================

// PATCH /api/admin/orders/:orderId/cancel

const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { cancellationReason } = req.body;

    // -------------------------------------------------
    // Validate ID
    // -------------------------------------------------

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    // -------------------------------------------------
    // Validate Reason
    // -------------------------------------------------

    if (
      cancellationReason !== undefined &&
      typeof cancellationReason !== "string"
    ) {
      return next(new ApiError(400, "Cancellation reason must be a string"));
    }

    const reason = cancellationReason
      ? cancellationReason.trim()
      : "Cancelled by admin";

    if (reason.length > 500) {
      return next(
        new ApiError(400, "Cancellation reason cannot exceed 500 characters"),
      );
    }

    // -------------------------------------------------
    // Find Order
    // -------------------------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // -------------------------------------------------
    // Already Cancelled
    // -------------------------------------------------

    if (order.orderStatus === "cancelled") {
      return next(new ApiError(400, "Order is already cancelled"));
    }

    // -------------------------------------------------
    // Delivered
    // -------------------------------------------------

    if (order.orderStatus === "delivered") {
      return next(new ApiError(400, "Delivered order cannot be cancelled"));
    }

    // -------------------------------------------------
    // Returned / Refunded
    // -------------------------------------------------

    if (["returned", "refunded"].includes(order.orderStatus)) {
      return next(new ApiError(400, "This order cannot be cancelled"));
    }

    // -------------------------------------------------
    // Cancel Order
    // -------------------------------------------------

    order.orderStatus = "cancelled";

    order.cancelledAt = new Date();

    order.cancellationReason = reason;

    await order.save();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    const cancelledOrder = await Order.findById(order._id)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .populate({
        // Order.items.seller → Seller._id
        path: "items.seller",
        select: "businessName businessEmail businessPhone verificationStatus",
        populate: {
          // Seller.user → User._id
          path: "user",
          select: "name email phone avatar",
        },
      })
      .lean();

    return res.status(200).json({
      success: true,

      message: "Order cancelled successfully",

      data: cancelledOrder,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
