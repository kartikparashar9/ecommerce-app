const express = require("express");

const router = express.Router();

const {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require("../controllers/cartController");

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    cartLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

const {
    validateAddToCart,
    validateUpdateCartItem,
    validateCartItemId,
} = require("../validator/cartValidator");

// =====================================================
// RATE LIMITING
// =====================================================

router.use(cartLimiter);

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET CART
// GET /api/cart
// =====================================================

router.get(
    "/",
    getMyCart
);

// =====================================================
// ADD TO CART
// POST /api/cart
// =====================================================

router.post(
    "/",
    validateAddToCart,
    addToCart
);

// =====================================================
// UPDATE CART ITEM
// PATCH /api/cart/:itemId
// =====================================================

router.patch(
    "/:itemId",
    validateCartItemId,
    validateUpdateCartItem,
    updateCartItem
);

// =====================================================
// REMOVE CART ITEM
// DELETE /api/cart/:itemId
// =====================================================

router.delete(
    "/:itemId",
    validateCartItemId,
    removeCartItem
);

// =====================================================
// CLEAR CART
// DELETE /api/cart
// =====================================================

router.delete(
    "/",
    clearCart
);

module.exports = router;