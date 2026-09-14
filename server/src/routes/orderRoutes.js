const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
} = require("../controllers/orderController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    orderLimiter,
} = require("../middleware/rateLimitterMiddleware");

// =====================================================
// VALIDATORS
// =====================================================

const {
    validateCreateOrder,
    validateOrderId,
    validateCancelOrder,
} = require("../validator/orderValidator");

// =====================================================
// AUTHENTICATION
// =====================================================

// All order APIs require authentication.

router.use(authMiddleware);

// =====================================================
// RATE LIMITING
// =====================================================

// Applies to all order APIs.

router.use(orderLimiter);

// =====================================================
// CREATE ORDER
// =====================================================

// POST /api/orders

router.post(
    "/",
    validateCreateOrder,
    createOrder
);

// =====================================================
// GET MY ORDERS
// =====================================================

// GET /api/orders

router.get(
    "/",
    getMyOrders
);

// =====================================================
// CANCEL ORDER
// =====================================================

// PATCH /api/orders/:orderId/cancel

router.patch(
    "/:orderId/cancel",
    validateOrderId,
    validateCancelOrder,
    cancelOrder
);

// =====================================================
// GET SINGLE ORDER
// =====================================================

// GET /api/orders/:orderId

router.get(
    "/:orderId",
    validateOrderId,
    getOrderById
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;