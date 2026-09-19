const express = require("express");

const router = express.Router();

const {
    createShipping,
    getShippingByOrderId,
    getMyShipping,
    updateShipping,
    updateShippingStatus,
    getAllShipping,
} = require("../controllers/shippingController");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    shippingLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

const {
    validateOrderId,
    validateCreateShipping,
    validateUpdateShipping,
    validateShippingStatus,
} = require("../validator/shippingValidator");

router.use(
    authMiddleware,
    shippingLimiter
);

router.get(
    "/my",
    authorizeRoles(
        "user",
        "customer"
    ),
    getMyShipping
);

router.get(
    "/order/:orderId",
    authorizeRoles(
        "user",
        "customer",
        "seller",
        "admin"
    ),
    validateOrderId,
    getShippingByOrderId
);

router.get(
    "/admin/all",
    authorizeRoles("admin"),
    getAllShipping
);

router.post(
    "/",
    authorizeRoles(
        "admin",
        "seller",
    ),
    validateCreateShipping,
    createShipping
);

router.patch(
    "/order/:orderId",
    authorizeRoles(
        "admin",
        "seller"
    ),
    validateOrderId,
    validateUpdateShipping,
    updateShipping
);

router.patch(
    "/order/:orderId/status",
    authorizeRoles(
        "admin",
        "seller"
    ),
    validateOrderId,
    validateShippingStatus,
    updateShippingStatus
);

module.exports = router;