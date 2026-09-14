const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const Product = require("../../models/productModel");
const Seller = require("../../models/sellerModel");

const ApiError = require("../../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// Parse Date
// -----------------------------------------------------

const parseDate = (dateValue) => {
    if (!dateValue) {
        return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

// -----------------------------------------------------
// Get Date Range
// -----------------------------------------------------

const getDateRange = (query) => {
    const { startDate, endDate } = query;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const dateFilter = {};

    if (start) {
        start.setHours(0, 0, 0, 0);

        dateFilter.$gte = start;
    }

    if (end) {
        end.setHours(23, 59, 59, 999);

        dateFilter.$lte = end;
    }

    return Object.keys(dateFilter).length > 0
        ? dateFilter
        : null;
};

// -----------------------------------------------------
// Build Date Match
// -----------------------------------------------------

const buildDateMatch = (query) => {
    const dateRange = getDateRange(query);

    if (!dateRange) {
        return {};
    }

    return {
        createdAt: dateRange,
    };
};

// -----------------------------------------------------
// Get Group Format
// -----------------------------------------------------

const getGroupFormat = (groupBy) => {
    if (groupBy === "monthly") {
        return {
            year: {
                $year: "$createdAt",
            },

            month: {
                $month: "$createdAt",
            },
        };
    }

    return {
        year: {
            $year: "$createdAt",
        },

        month: {
            $month: "$createdAt",
        },

        day: {
            $dayOfMonth: "$createdAt",
        },
    };
};

// =====================================================
// ADMIN DASHBOARD OVERVIEW
// =====================================================

const getDashboardOverview = async (
    req,
    res,
    next
) => {
    try {
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            orderStats,
            recentOrders,
        ] = await Promise.all([
            // ---------------------------------------------
            // Total Users
            // ---------------------------------------------

            User.countDocuments({
                role: "user",
                isBlocked: false,
            }),

            // ---------------------------------------------
            // Total Active Sellers
            // ---------------------------------------------

            Seller.countDocuments({
                verificationStatus: "approved",
                isActive: true,
                isBlocked: false,
                isDeleted: false,
            }),

            // ---------------------------------------------
            // Total Active Products
            // ---------------------------------------------

            Product.countDocuments({
                isActive: true,
            }),

            // ---------------------------------------------
            // Total Orders
            // ---------------------------------------------

            Order.countDocuments(),

            // ---------------------------------------------
            // Order Statistics
            // ---------------------------------------------

            Order.aggregate([
                {
                    $group: {
                        _id: null,

                        totalRevenue: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            "$orderStatus",
                                            [
                                                "cancelled",
                                                "returned",
                                            ],
                                        ],
                                    },
                                    0,
                                    "$totalAmount",
                                ],
                            },
                        },

                        deliveredOrders: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$orderStatus",
                                            "delivered",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        pendingOrders: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$orderStatus",
                                            "pending",
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // ---------------------------------------------
            // Recent Orders
            // ---------------------------------------------

            Order.find()
                .sort({
                    createdAt: -1,
                })
                .limit(10)
                .populate({
                    path: "user",
                    select: "name email",
                })
                .select(
                    "orderNumber user totalAmount paymentStatus orderStatus createdAt"
                )
                .lean(),
        ]);

        const statistics =
            orderStats.length > 0
                ? orderStats[0]
                : {
                      totalRevenue: 0,
                      deliveredOrders: 0,
                      pendingOrders: 0,
                  };

        return res.status(200).json({
            success: true,

            message:
                "Dashboard analytics fetched successfully",

            data: {
                overview: {
                    totalUsers,

                    totalSellers,

                    totalProducts,

                    totalOrders,

                    totalRevenue:
                        statistics.totalRevenue,

                    deliveredOrders:
                        statistics.deliveredOrders,

                    pendingOrders:
                        statistics.pendingOrders,
                },

                recentOrders,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// ORDER ANALYTICS
// =====================================================

const getOrderAnalytics = async (
    req,
    res,
    next
) => {
    try {
        const dateMatch =
            buildDateMatch(req.query);

        const statusAnalytics =
            await Order.aggregate([
                {
                    $match: dateMatch,
                },

                {
                    $group: {
                        _id: "$orderStatus",

                        count: {
                            $sum: 1,
                        },

                        totalAmount: {
                            $sum: "$totalAmount",
                        },
                    },
                },

                {
                    $sort: {
                        count: -1,
                    },
                },
            ]);

        const totalOrders =
            statusAnalytics.reduce(
                (total, item) =>
                    total + item.count,
                0
            );

        return res.status(200).json({
            success: true,

            message:
                "Order analytics fetched successfully",

            data: {
                totalOrders,

                statusAnalytics,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// REVENUE ANALYTICS
// =====================================================

const getRevenueAnalytics = async (
    req,
    res,
    next
) => {
    try {
        const dateMatch =
            buildDateMatch(req.query);

        const revenueAnalytics =
            await Order.aggregate([
                {
                    $match: {
                        ...dateMatch,

                        orderStatus: {
                            $nin: [
                                "cancelled",
                                "returned",
                            ],
                        },
                    },
                },

                {
                    $group: {
                        _id: null,

                        totalRevenue: {
                            $sum: "$totalAmount",
                        },

                        totalOrders: {
                            $sum: 1,
                        },

                        averageOrderValue: {
                            $avg: "$totalAmount",
                        },
                    },
                },
            ]);

        const data =
            revenueAnalytics.length > 0
                ? revenueAnalytics[0]
                : {
                      totalRevenue: 0,

                      totalOrders: 0,

                      averageOrderValue: 0,
                  };

        return res.status(200).json({
            success: true,

            message:
                "Revenue analytics fetched successfully",

            data,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// SALES TRENDS
// =====================================================

const getSalesTrends = async (
    req,
    res,
    next
) => {
    try {
        const {
            groupBy = "daily",
        } = req.query;

        const dateMatch =
            buildDateMatch(req.query);

        const groupFormat =
            getGroupFormat(groupBy);

        const trends =
            await Order.aggregate([
                {
                    $match: {
                        ...dateMatch,

                        orderStatus: {
                            $nin: [
                                "cancelled",
                                "returned",
                            ],
                        },
                    },
                },

                {
                    $group: {
                        _id: groupFormat,

                        totalRevenue: {
                            $sum: "$totalAmount",
                        },

                        totalOrders: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                        "_id.day": 1,
                    },
                },
            ]);

        return res.status(200).json({
            success: true,

            message:
                "Sales trends fetched successfully",

            data: {
                groupBy,

                trends,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// TOP PRODUCTS
// =====================================================

const getTopProducts = async (
    req,
    res,
    next
) => {
    try {
        const limit =
            Math.min(
                Math.max(
                    Number(req.query.limit) || 10,
                    1
                ),
                100
            );

        const dateMatch =
            buildDateMatch(req.query);

        const topProducts =
            await Order.aggregate([
                {
                    $match: {
                        ...dateMatch,

                        orderStatus: {
                            $nin: [
                                "cancelled",
                                "returned",
                            ],
                        },
                    },
                },

                {
                    $unwind: "$items",
                },

                {
                    $group: {
                        _id:
                            "$items.product",

                        productName: {
                            $first:
                                "$items.productName",
                        },

                        productSlug: {
                            $first:
                                "$items.productSlug",
                        },

                        image: {
                            $first:
                                "$items.image",
                        },

                        totalQuantitySold: {
                            $sum:
                                "$items.quantity",
                        },

                        totalRevenue: {
                            $sum:
                                "$items.itemTotal",
                        },

                        totalOrderItems: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        totalQuantitySold: -1,
                        totalRevenue: -1,
                    },
                },

                {
                    $limit: limit,
                },
            ]);

        return res.status(200).json({
            success: true,

            message:
                "Top products fetched successfully",

            count:
                topProducts.length,

            data: topProducts,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// TOP SELLERS
// =====================================================

const getTopSellers = async (
    req,
    res,
    next
) => {
    try {
        const limit =
            Math.min(
                Math.max(
                    Number(req.query.limit) || 10,
                    1
                ),
                100
            );

        const dateMatch =
            buildDateMatch(req.query);

        const topSellers =
            await Order.aggregate([
                {
                    $match: {
                        ...dateMatch,

                        orderStatus: {
                            $nin: [
                                "cancelled",
                                "returned",
                            ],
                        },
                    },
                },

                {
                    $unwind: "$items",
                },

                {
                    $group: {
                        _id:
                            "$items.seller",

                        totalProductsSold: {
                            $sum:
                                "$items.quantity",
                        },

                        totalRevenue: {
                            $sum:
                                "$items.itemTotal",
                        },

                        orderCount: {
                            $addToSet:
                                "$_id",
                        },
                    },
                },

                {
                    $addFields: {
                        totalOrders: {
                            $size:
                                "$orderCount",
                        },
                    },
                },

                {
                    $lookup: {
                        from: "sellers",

                        localField: "_id",

                        foreignField: "user",

                        as: "sellerInfo",
                    },
                },

                {
                    $unwind: {
                        path: "$sellerInfo",

                        preserveNullAndEmptyArrays:
                            true,
                    },
                },

                {
                    $project: {
                        _id: 1,

                        businessName:
                            "$sellerInfo.businessName",

                        businessEmail:
                            "$sellerInfo.businessEmail",

                        logo:
                            "$sellerInfo.logo",

                        totalProductsSold: 1,

                        totalRevenue: 1,

                        totalOrders: 1,
                    },
                },

                {
                    $sort: {
                        totalRevenue: -1,
                    },
                },

                {
                    $limit: limit,
                },
            ]);

        return res.status(200).json({
            success: true,

            message:
                "Top sellers fetched successfully",

            count:
                topSellers.length,

            data: topSellers,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// USER ANALYTICS
// =====================================================

const getUserAnalytics = async (
    req,
    res,
    next
) => {
    try {
        const {
            groupBy = "daily",
        } = req.query;

        const dateMatch =
            buildDateMatch(req.query);

        const groupFormat =
            getGroupFormat(groupBy);

        const [
            totalUsers,
            userTrends,
        ] = await Promise.all([
            User.countDocuments({
                role: "user",
            }),

            User.aggregate([
                {
                    $match: {
                        ...dateMatch,

                        role: "user",
                    },
                },

                {
                    $group: {
                        _id: groupFormat,

                        newUsers: {
                            $sum: 1,
                        },
                    },
                },

                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                        "_id.day": 1,
                    },
                },
            ]),
        ]);

        return res.status(200).json({
            success: true,

            message:
                "User analytics fetched successfully",

            data: {
                totalUsers,

                groupBy,

                trends:
                    userTrends,
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
    getDashboardOverview,
    getOrderAnalytics,
    getRevenueAnalytics,
    getSalesTrends,
    getTopProducts,
    getTopSellers,
    getUserAnalytics,
};