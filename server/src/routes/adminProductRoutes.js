const express = require("express");

const router = express.Router();

const {
    getAllProducts,
    getProductById,
    activateProduct,
    deactivateProduct,
    featureProduct,
    unfeatureProduct,
} = require("../controllers/admin/adminProductController");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    adminLimiter,
} = require("../middleware/rateLimitterMiddleware");

router.use(
    authMiddleware,
    authorizeRoles("admin"),
    adminLimiter
);

router.get(
    "/products",
    getAllProducts
);

router.get(
    "/products/:productId",
    getProductById
);

router.patch(
    "/products/:productId/activate",
    activateProduct
);

router.patch(
    "/products/:productId/deactivate",
    deactivateProduct
);

router.patch(
    "/products/:productId/feature",
    featureProduct
);

router.patch(
    "/products/:productId/unfeature",
    unfeatureProduct
);

module.exports = router;