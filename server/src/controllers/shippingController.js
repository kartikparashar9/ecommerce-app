const mongoose = require("mongoose");

const Shipping = require("../models/shippingModel");
const Order = require("../models/orderModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// Check Seller Ownership
// -----------------------------------------------------

const isSellerOfOrder = (
    order,
    sellerId
) => {
    if (
        !order ||
        !Array.isArray(order.items)
    ) {
        return false;
    }

    return order.items.some(
        (item) =>
            item.seller &&
            item.seller.toString() ===
                sellerId.toString()
    );
};

// -----------------------------------------------------
// Populate Shipping
// -----------------------------------------------------

const populateShipping = (query) => {
    return query
        .populate({
            path: "order",
            select:
                "orderNumber user items shippingAddress subtotal shippingFee discount totalAmount paymentMethod paymentStatus orderStatus createdAt",
            populate: [
                {
                    path: "user",
                    select:
                        "name email phone",
                },
                {
                    path: "items.product",
                    select:
                        "name slug",
                },
                {
                    path: "items.seller",
                    select:
                        "name email",
                },
            ],
        })
        .populate({
            path: "user",
            select:
                "name email phone",
        });
};

// =====================================================
// CREATE SHIPPING
// ADMIN / SELLER
// =====================================================

const createShipping = async (
    req,
    res,
    next
) => {
    const session =
        await mongoose.startSession();

    try {
        const {
            orderId,
            carrier = "",
            trackingNumber = "",
            trackingUrl = "",
            estimatedDelivery = null,
            notes = "",
        } = req.body;

        const userId =
            req.user?._id;

        const role =
            req.user?.role;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Validate ObjectId
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid order ID"
                )
            );
        }

        session.startTransaction();

        // -------------------------------------------------
        // Find Order
        // -------------------------------------------------

        const order =
            await Order.findById(
                orderId
            ).session(session);

        if (!order) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // Seller Authorization
        // -------------------------------------------------

        if (role === "seller") {
            if (
                !isSellerOfOrder(
                    order,
                    userId
                )
            ) {
                await session.abortTransaction();

                return next(
                    new ApiError(
                        403,
                        "You are not authorized to manage shipping for this order"
                    )
                );
            }
        }

        // -------------------------------------------------
        // Admin / Seller Only
        // -------------------------------------------------

        if (
            role !== "admin" &&
            role !== "seller"
        ) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    403,
                    "Only admin or seller can create shipping"
                )
            );
        }

        // -------------------------------------------------
        // Check Existing Shipping
        // -------------------------------------------------

        const existingShipping =
            await Shipping.findOne({
                order: order._id,
            }).session(session);

        if (existingShipping) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    409,
                    "Shipping already exists for this order"
                )
            );
        }

        // -------------------------------------------------
        // Create Shipping
        // -------------------------------------------------

        const shipping =
            new Shipping({
                order: order._id,
                user: order.user,
                carrier:
                    typeof carrier === "string"
                        ? carrier.trim()
                        : "",
                trackingNumber:
                    typeof trackingNumber ===
                    "string"
                        ? trackingNumber
                              .trim()
                              .toUpperCase()
                        : "",
                trackingUrl:
                    typeof trackingUrl ===
                    "string"
                        ? trackingUrl.trim()
                        : "",
                estimatedDelivery:
                    estimatedDelivery
                        ? new Date(
                              estimatedDelivery
                          )
                        : null,
                notes:
                    typeof notes ===
                    "string"
                        ? notes.trim()
                        : "",
                status: "pending",
            });

        await shipping.save({
            session,
        });

        // -------------------------------------------------
        // Sync Order Status
        // -------------------------------------------------

        if (
            order.orderStatus ===
            "pending"
        ) {
            order.orderStatus =
                "confirmed";

            await order.save({
                session,
            });
        }

        await session.commitTransaction();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        const createdShipping =
            await populateShipping(
                Shipping.findById(
                    shipping._id
                )
            ).lean();

        return res.status(201).json({
            success: true,
            message:
                "Shipping created successfully",
            data: createdShipping,
        });
    } catch (error) {
        if (
            session.inTransaction()
        ) {
            await session.abortTransaction();
        }

        // Duplicate order shipping
        if (
            error?.code === 11000
        ) {
            return next(
                new ApiError(
                    409,
                    "Shipping already exists for this order"
                )
            );
        }

        return next(error);
    } finally {
        session.endSession();
    }
};

// =====================================================
// GET SHIPPING BY ORDER
// =====================================================

const getShippingByOrderId = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        const role =
            req.user?.role;

        const { orderId } =
            req.params;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid order ID"
                )
            );
        }

        // -------------------------------------------------
        // Find Order
        // -------------------------------------------------

        const order =
            await Order.findById(
                orderId
            ).lean();

        if (!order) {
            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // Authorization
        // -------------------------------------------------

        if (
            role === "user" ||
            role === "customer"
        ) {
            if (
                order.user.toString() !==
                userId.toString()
            ) {
                return next(
                    new ApiError(
                        403,
                        "You are not authorized to view this shipping information"
                    )
                );
            }
        }

        if (role === "seller") {
            if (
                !isSellerOfOrder(
                    order,
                    userId
                )
            ) {
                return next(
                    new ApiError(
                        403,
                        "You are not authorized to view this shipping information"
                    )
                );
            }
        }

        if (
            ![
                "user",
                "customer",
                "seller",
                "admin",
            ].includes(role)
        ) {
            return next(
                new ApiError(
                    403,
                    "You are not authorized to view this shipping information"
                )
            );
        }

        // -------------------------------------------------
        // Shipping
        // -------------------------------------------------

        const shipping =
            await populateShipping(
                Shipping.findOne({
                    order: orderId,
                })
            ).lean();

        if (!shipping) {
            return next(
                new ApiError(
                    404,
                    "Shipping information not found"
                )
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Shipping information fetched successfully",
            data: shipping,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// GET MY SHIPPING
// =====================================================

const getMyShipping = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const shipping =
            await populateShipping(
                Shipping.find({
                    user: userId,
                }).sort({
                    createdAt: -1,
                })
            ).lean();

        return res.status(200).json({
            success: true,
            message:
                "Shipping information fetched successfully",
            count: shipping.length,
            data: shipping,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// UPDATE SHIPPING DETAILS
// ADMIN / SELLER
// =====================================================

const updateShipping = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        const role =
            req.user?.role;

        const { orderId } =
            req.params;

        const {
            carrier,
            trackingNumber,
            trackingUrl,
            estimatedDelivery,
            notes,
        } = req.body;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const order =
            await Order.findById(
                orderId
            );

        if (!order) {
            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        if (
            role === "seller" &&
            !isSellerOfOrder(
                order,
                userId
            )
        ) {
            return next(
                new ApiError(
                    403,
                    "You are not authorized to update this shipping information"
                )
            );
        }

        if (
            role !== "admin" &&
            role !== "seller"
        ) {
            return next(
                new ApiError(
                    403,
                    "Only admin or seller can update shipping"
                )
            );
        }

        const shipping =
            await Shipping.findOne({
                order: orderId,
            });

        if (!shipping) {
            return next(
                new ApiError(
                    404,
                    "Shipping information not found"
                )
            );
        }

        // -------------------------------------------------
        // Prevent Modification After Terminal Status
        // -------------------------------------------------

        if (
            [
                "delivered",
                "cancelled",
                "returned",
            ].includes(
                shipping.status
            )
        ) {
            return next(
                new ApiError(
                    400,
                    `Shipping cannot be updated when status is ${shipping.status}`
                )
            );
        }

        if (
            carrier !== undefined
        ) {
            shipping.carrier =
                carrier.trim();
        }

        if (
            trackingNumber !==
            undefined
        ) {
            shipping.trackingNumber =
                trackingNumber
                    .trim()
                    .toUpperCase();
        }

        if (
            trackingUrl !==
            undefined
        ) {
            shipping.trackingUrl =
                trackingUrl.trim();
        }

        if (
            estimatedDelivery !==
            undefined
        ) {
            shipping.estimatedDelivery =
                estimatedDelivery
                    ? new Date(
                          estimatedDelivery
                      )
                    : null;
        }

        if (
            notes !== undefined
        ) {
            shipping.notes =
                notes.trim();
        }

        await shipping.save();

        const updatedShipping =
            await populateShipping(
                Shipping.findById(
                    shipping._id
                )
            ).lean();

        return res.status(200).json({
            success: true,
            message:
                "Shipping updated successfully",
            data: updatedShipping,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// UPDATE SHIPPING STATUS
// ADMIN / SELLER
// =====================================================

const updateShippingStatus = async (
    req,
    res,
    next
) => {
    const session =
        await mongoose.startSession();

    try {
        const userId =
            req.user?._id;

        const role =
            req.user?.role;

        const { orderId } =
            req.params;

        const { status } =
            req.body;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        session.startTransaction();

        // -------------------------------------------------
        // Order
        // -------------------------------------------------

        const order =
            await Order.findById(
                orderId
            ).session(session);

        if (!order) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // Seller Authorization
        // -------------------------------------------------

        if (
            role === "seller" &&
            !isSellerOfOrder(
                order,
                userId
            )
        ) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    403,
                    "You are not authorized to manage this shipping"
                )
            );
        }

        if (
            role !== "admin" &&
            role !== "seller"
        ) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    403,
                    "Only admin or seller can update shipping status"
                )
            );
        }

        // -------------------------------------------------
        // Shipping
        // -------------------------------------------------

        const shipping =
            await Shipping.findOne({
                order: orderId,
            }).session(session);

        if (!shipping) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    404,
                    "Shipping information not found"
                )
            );
        }

        // -------------------------------------------------
        // Same Status
        // -------------------------------------------------

        if (
            shipping.status ===
            status
        ) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    400,
                    `Shipping is already ${status}`
                )
            );
        }

        // -------------------------------------------------
        // Status Transition Rules
        // -------------------------------------------------

        const allowedTransitions = {
            pending: [
                "processing",
                "cancelled",
            ],

            processing: [
                "shipped",
                "cancelled",
            ],

            shipped: [
                "out_for_delivery",
                "delivered",
                "returned",
            ],

            out_for_delivery: [
                "delivered",
                "returned",
            ],

            delivered: [
                "returned",
            ],

            cancelled: [],

            returned: [],
        };

        const allowed =
            allowedTransitions[
                shipping.status
            ] || [];

        if (
            !allowed.includes(
                status
            )
        ) {
            await session.abortTransaction();

            return next(
                new ApiError(
                    400,
                    `Cannot change shipping status from ${shipping.status} to ${status}`
                )
            );
        }

        // -------------------------------------------------
        // Update Shipping
        // -------------------------------------------------

        shipping.status =
            status;

        // -------------------------------------------------
        // Status Specific Fields
        // -------------------------------------------------

        if (
            status ===
            "delivered"
        ) {
            shipping.deliveredAt =
                new Date();

            shipping.cancelledAt =
                null;

            shipping.returnedAt =
                null;
        }

        if (
            status ===
            "cancelled"
        ) {
            shipping.cancelledAt =
                new Date();

            shipping.deliveredAt =
                null;
        }

        if (
            status ===
            "returned"
        ) {
            shipping.returnedAt =
                new Date();
        }

        await shipping.save({
            session,
        });

        // -------------------------------------------------
        // Synchronize Order Status
        // -------------------------------------------------

        const orderStatusMap = {
            pending: "pending",
            processing: "processing",
            shipped: "shipped",
            out_for_delivery:
                "out_for_delivery",
            delivered: "delivered",
            cancelled: "cancelled",
            returned: "returned",
        };

        const newOrderStatus =
            orderStatusMap[
                status
            ];

        if (
            newOrderStatus
        ) {
            order.orderStatus =
                newOrderStatus;
        }

        if (
            status ===
            "delivered"
        ) {
            order.deliveredAt =
                new Date();
        }

        if (
            status ===
            "cancelled"
        ) {
            order.cancelledAt =
                new Date();
        }

        await order.save({
            session,
        });

        await session.commitTransaction();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        const updatedShipping =
            await populateShipping(
                Shipping.findById(
                    shipping._id
                )
            ).lean();

        return res.status(200).json({
            success: true,
            message:
                "Shipping status updated successfully",
            data: updatedShipping,
        });
    } catch (error) {
        if (
            session.inTransaction()
        ) {
            await session.abortTransaction();
        }

        return next(error);
    } finally {
        session.endSession();
    }
};

// =====================================================
// ADMIN GET ALL SHIPPING
// =====================================================

const getAllShipping = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNumber =
            Math.max(
                Number(page) || 1,
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const filter = {};

        if (status) {
            const allowedStatuses = [
                "pending",
                "processing",
                "shipped",
                "out_for_delivery",
                "delivered",
                "cancelled",
                "returned",
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return next(
                    new ApiError(
                        400,
                        "Invalid shipping status"
                    )
                );
            }

            filter.status =
                status;
        }

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            shipping,
            total,
        ] =
            await Promise.all([
                populateShipping(
                    Shipping.find(
                        filter
                    )
                        .sort({
                            createdAt:
                                -1,
                        })
                        .skip(skip)
                        .limit(
                            limitNumber
                        )
                ).lean(),

                Shipping.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            message:
                "Shipping records fetched successfully",

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages:
                    Math.ceil(
                        total /
                            limitNumber
                    ),
            },

            data: shipping,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createShipping,
    getShippingByOrderId,
    getMyShipping,
    updateShipping,
    updateShippingStatus,
    getAllShipping,
};