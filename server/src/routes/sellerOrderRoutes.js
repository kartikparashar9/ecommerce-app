const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
} = require("../controllers/seller/sellerOrderController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { sellerLimiter } = require("../middleware/rateLimitterMiddleware");
const isApprovedSeller = require("../middleware/isApprovedSeller");

// =====================================================
// VALIDATORS
// =====================================================

const {
  validateSellerOrderId,
  validateSellerOrderStatus,
  validateSellerOrderQuery,
} = require("../validator/sellerOrderValidator");

// =====================================================
// SELLER AUTHENTICATION
// =====================================================

router.use(
  authMiddleware,
  authorizeRoles("seller"),
  isApprovedSeller,
  sellerLimiter,
);

// =====================================================
// GET SELLER ORDERS
// GET /api/seller/orders
// =====================================================

router.get("/", validateSellerOrderQuery, getSellerOrders);

// =====================================================
// UPDATE ORDER STATUS
// PATCH /api/seller/orders/:orderId/status
// =====================================================

router.patch(
  "/:orderId/status",
  validateSellerOrderId,
  validateSellerOrderStatus,
  updateSellerOrderStatus,
);

// =====================================================
// GET SINGLE SELLER ORDER
// GET /api/seller/orders/:orderId
// =====================================================

router.get("/:orderId", validateSellerOrderId, getSellerOrderById);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
