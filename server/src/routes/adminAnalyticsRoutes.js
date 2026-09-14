const express = require("express");

const router = express.Router();

const {
    getDashboardOverview,
    getOrderAnalytics,
    getRevenueAnalytics,
    getSalesTrends,
    getTopProducts,
    getTopSellers,
    getUserAnalytics,
} = require("../controllers/admin/adminAnalyticsController");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    adminLimiter,
} = require("../middleware/rateLimitterMiddleware");

const {
    validateAnalyticsDateRange,
    validateTrendAnalytics,
    validateTopAnalytics,
} = require("../validator/adminAnalyticsValidator");

router.use(
    authMiddleware,
    authorizeRoles("admin"),
    adminLimiter
);

router.get(
    "/dashboard",
    getDashboardOverview
);

router.get(
    "/orders",
    validateAnalyticsDateRange,
    getOrderAnalytics
);

router.get(
    "/revenue",
    validateAnalyticsDateRange,
    getRevenueAnalytics
);

router.get(
    "/sales-trends",
    validateTrendAnalytics,
    getSalesTrends
);

router.get(
    "/top-products",
    validateTopAnalytics,
    getTopProducts
);

router.get(
    "/top-sellers",
    validateTopAnalytics,
    getTopSellers
);

router.get(
    "/users",
    validateTrendAnalytics,
    getUserAnalytics
);

module.exports = router;