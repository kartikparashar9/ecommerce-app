const express = require("express");

const router = express.Router();

const {
    getAdminDashboard,
} = require(
    "../controllers/admin/adminDashboardController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const authorizeRoles = require(
    "../middleware/roleMiddleware"
);

const {
    adminLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

router.use(
    authMiddleware,
    authorizeRoles("admin"),
    adminLimiter
);

router.get(
    "/dashboard",
    getAdminDashboard
);

module.exports = router;