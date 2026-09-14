const express = require("express");

const router = express.Router();

const {
    getMyWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    clearWishlist,
} = require("../controllers/wishlistController");

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    wishlistLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

const {
    validateAddToWishlist,
    validateRemoveFromWishlist,
    validateCheckWishlist,
} = require("../validator/wishlistValidator");

router.use(
    authMiddleware,
    wishlistLimiter
);

router.get(
    "/",
    getMyWishlist
);

router.post(
    "/:productId",
    validateAddToWishlist,
    addToWishlist
);

router.get(
    "/:productId/check",
    validateCheckWishlist,
    checkWishlist
);

router.delete(
    "/:productId",
    validateRemoveFromWishlist,
    removeFromWishlist
);

router.delete(
    "/",
    clearWishlist
);

module.exports = router;