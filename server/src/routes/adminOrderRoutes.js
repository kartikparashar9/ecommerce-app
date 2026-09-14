const express = require("express");

const router = express.Router();

const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} = require("../controllers/admin/adminOrderController");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    adminLimiter,
} = require("../middleware/rateLimitterMiddleware");

const {
    validateOrderId,
    validateOrderStatus,
    validateCancelOrder,
    validateAdminOrderQuery,
} = require("../validator/adminOrderValidator");

router.use(
    authMiddleware,
    authorizeRoles("admin"),
    adminLimiter
);

router.get(
    "/",
    validateAdminOrderQuery,
    getAllOrders
);

router.patch(
    "/:orderId/status",
    validateOrderId,
    validateOrderStatus,
    updateOrderStatus
);

router.patch(
    "/:orderId/cancel",
    validateOrderId,
    validateCancelOrder,
    cancelOrder
);

router.get(
    "/:orderId",
    validateOrderId,
    getOrderById
);

module.exports = router;