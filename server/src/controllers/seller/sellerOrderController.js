const mongoose = require("mongoose");
const Order = require("../../models/orderModel");
const Seller = require("../../models/sellerModel");
const ApiError = require("../../utils/ApiError");

// =====================================================
// CONSTANTS
// =====================================================

const SELLER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const STATUS_FLOW = {
  pending: ["confirmed"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
};

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// -----------------------------------------------------
// Get Seller Items
// -----------------------------------------------------
//
// Current Order model:
// Order.items.seller → Seller._id
//
// We keep support for both Seller._id and User._id here
// so existing orders created before the reference change
// do not suddenly disappear from the seller dashboard.
// -----------------------------------------------------

const getSellerItems = (order, sellerIds) => {
  const idStrings = sellerIds.map((id) => id.toString());

  return order.items.filter(
    (item) => item.seller && idStrings.includes(item.seller.toString()),
  );
};

// -----------------------------------------------------
// Get Seller IDs
// -----------------------------------------------------
//
// Primary ID:
// Seller._id
//
// Legacy compatibility:
// User._id
//
// New orders should contain Seller._id.
// The User._id fallback prevents older orders from becoming
// invisible if they were created before the Order schema
// reference was changed.
// -----------------------------------------------------

const getSellerIdList = async (userId) => {
  const sellerIds = [userId];

  const seller = await Seller.findOne({
    user: userId,
    isDeleted: false,
  }).select("_id");

  if (seller) {
    sellerIds.push(seller._id);
  }

  return sellerIds;
};

// -----------------------------------------------------
// Get Active Approved Seller
// -----------------------------------------------------

const getApprovedSeller = async (userId) => {
  const seller = await Seller.findOne({
    user: userId,
    isDeleted: false,
  });

  if (!seller) {
    return {
      error: new ApiError(404, "Seller profile not found"),
    };
  }

  if (seller.isBlocked) {
    return {
      error: new ApiError(403, "Blocked seller accounts are read-only"),
    };
  }

  if (!seller.isActive) {
    return {
      error: new ApiError(403, "Inactive seller accounts cannot manage orders"),
    };
  }

  if (seller.verificationStatus !== "approved") {
    return {
      error: new ApiError(403, "Seller account is not approved"),
    };
  }

  return {
    seller,
  };
};

// =====================================================
// GET SELLER ORDERS
// =====================================================

// GET /api/seller/orders

const getSellerOrders = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Seller Access Check
    // -------------------------------------------------

    const sellerAccess = await getApprovedSeller(userId);

    if (sellerAccess.error) {
      return next(sellerAccess.error);
    }

    const sellerProfile = sellerAccess.seller;

    // -------------------------------------------------
    // Query
    // -------------------------------------------------

    const { status, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const normalizedStatus = status
      ? String(status).trim().toLowerCase()
      : null;

    if (normalizedStatus && !SELLER_STATUSES.includes(normalizedStatus)) {
      return next(new ApiError(400, "Invalid order status"));
    }

    // -------------------------------------------------
    // Seller IDs
    // -------------------------------------------------

    const sellerIds = await getSellerIdList(userId);

    // -------------------------------------------------
    // Filter
    // -------------------------------------------------

    const filter = {
      "items.seller": {
        $in: sellerIds,
      },
    };

    if (normalizedStatus) {
      filter.orderStatus = normalizedStatus;
    }

    const skip = (currentPage - 1) * perPage;

    // -------------------------------------------------
    // Fetch Orders
    // -------------------------------------------------

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .select(
          [
            "orderNumber",
            "user",
            "items",
            "shippingAddress",
            "subtotal",
            "shippingFee",
            "discount",
            "totalAmount",
            "paymentMethod",
            "paymentStatus",
            "orderStatus",
            "cancelledAt",
            "cancellationReason",
            "deliveredAt",
            "createdAt",
            "updatedAt",
          ].join(" "),
        )
        .populate({
          path: "user",
          select: "name email phone",
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
    // Only Seller's Items
    // -------------------------------------------------

    const sellerOrders = orders.map((order) => {
      const sellerItems = getSellerItems(order, sellerIds);

      const sellerSubtotal = sellerItems.reduce(
        (total, item) => total + Number(item.itemTotal || 0),
        0,
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,

        user: order.user,

        items: sellerItems,

        shippingAddress: order.shippingAddress,

        sellerSubtotal,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: order.orderStatus,

        cancelledAt: order.cancelledAt,

        cancellationReason: order.cancellationReason,

        deliveredAt: order.deliveredAt,

        createdAt: order.createdAt,

        updatedAt: order.updatedAt,
      };
    });

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const totalPages = Math.ceil(totalOrders / perPage);

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Seller orders fetched successfully",

      data: sellerOrders,

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
// GET SELLER ORDER BY ID
// =====================================================

// GET /api/seller/orders/:orderId

const getSellerOrderById = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    // -------------------------------------------------
    // Seller Access Check
    // -------------------------------------------------

    const sellerAccess = await getApprovedSeller(userId);

    if (sellerAccess.error) {
      return next(sellerAccess.error);
    }

    const sellerIds = await getSellerIdList(userId);

    // -------------------------------------------------
    // Find Seller's Order
    // -------------------------------------------------

    const order = await Order.findOne({
      _id: orderId,

      "items.seller": {
        $in: sellerIds,
      },
    })
      .populate({
        path: "user",
        select: "name email phone",
      })
      .lean();

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // -------------------------------------------------
    // Seller Items
    // -------------------------------------------------

    const sellerItems = getSellerItems(order, sellerIds);

    if (sellerItems.length === 0) {
      return next(new ApiError(403, "You do not have access to this order"));
    }

    // -------------------------------------------------
    // Seller Subtotal
    // -------------------------------------------------

    const sellerSubtotal = sellerItems.reduce(
      (total, item) => total + Number(item.itemTotal || 0),
      0,
    );

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Seller order fetched successfully",

      data: {
        _id: order._id,

        orderNumber: order.orderNumber,

        user: order.user,

        items: sellerItems,

        shippingAddress: order.shippingAddress,

        sellerSubtotal,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: order.orderStatus,

        cancelledAt: order.cancelledAt,

        cancellationReason: order.cancellationReason,

        deliveredAt: order.deliveredAt,

        createdAt: order.createdAt,

        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// UPDATE SELLER ORDER STATUS
// =====================================================

// PATCH /api/seller/orders/:orderId/status

const updateSellerOrderStatus = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { orderId } = req.params;

    const { status } = req.body;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

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

    if (!SELLER_STATUSES.includes(newStatus)) {
      return next(new ApiError(400, "Invalid seller order status"));
    }

    // -------------------------------------------------
    // Seller Access Check
    // -------------------------------------------------

    const sellerAccess = await getApprovedSeller(userId);

    if (sellerAccess.error) {
      return next(sellerAccess.error);
    }

    const sellerProfile = sellerAccess.seller;

    // -------------------------------------------------
    // Seller IDs
    // -------------------------------------------------

    const sellerIds = await getSellerIdList(userId);

    // -------------------------------------------------
    // Find Seller's Order
    // -------------------------------------------------

    const order = await Order.findOne({
      _id: orderId,

      "items.seller": {
        $in: sellerIds,
      },
    });

    if (!order) {
      return next(
        new ApiError(
          404,
          "Order not found or you do not have access to this order",
        ),
      );
    }

    // -------------------------------------------------
    // Same Status
    // -------------------------------------------------

    if (order.orderStatus === newStatus) {
      return next(new ApiError(400, `Order is already ${newStatus}`));
    }

    // -------------------------------------------------
    // Cancelled Order
    // -------------------------------------------------

    if (order.orderStatus === "cancelled") {
      return next(new ApiError(400, "Cancelled orders cannot be updated"));
    }

    // -------------------------------------------------
    // Returned / Refunded
    // -------------------------------------------------

    if (["returned", "refunded"].includes(order.orderStatus)) {
      return next(new ApiError(400, "This order can no longer be updated"));
    }

    // -------------------------------------------------
    // Status Flow
    // -------------------------------------------------

    const allowedNextStatuses = STATUS_FLOW[order.orderStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      return next(
        new ApiError(
          400,
          `Order cannot move from ${order.orderStatus} to ${newStatus}`,
        ),
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

    await order.save();

    // -------------------------------------------------
    // Fetch Updated Order
    // -------------------------------------------------

    const updatedOrder = await Order.findById(order._id)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .lean();

    // -------------------------------------------------
    // Seller Items
    // -------------------------------------------------

    const sellerItems = getSellerItems(updatedOrder, sellerIds);

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Order status updated successfully",

      data: {
        _id: updatedOrder._id,

        orderNumber: updatedOrder.orderNumber,

        user: updatedOrder.user,

        items: sellerItems,

        shippingAddress: updatedOrder.shippingAddress,

        paymentMethod: updatedOrder.paymentMethod,

        paymentStatus: updatedOrder.paymentStatus,

        orderStatus: updatedOrder.orderStatus,

        deliveredAt: updatedOrder.deliveredAt,

        createdAt: updatedOrder.createdAt,

        updatedAt: updatedOrder.updatedAt,
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
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
};
