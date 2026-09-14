const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
    createProduct,

    getSellerCategories,
    getSellerSubcategories,
    getSellerBrands,

    getAllProducts,
    getActiveProducts,
    getProductById,
    getProductBySlug,

    getMyProducts,

    updateProduct,
    deleteProduct,
    toggleProductStatus,
} = require("../controllers/productController");

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    productLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

// =====================================================
// VALIDATORS
// =====================================================

const {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
} = require("../validator/productValidator");

// =====================================================
// PUBLIC ROUTES
// =====================================================

router.get(
    "/active",
    productLimiter,
    getActiveProducts
);

router.get(
    "/slug/:slug",
    productLimiter,
    getProductBySlug
);

// =====================================================
// SELLER - CATEGORY / BRAND APIs
// =====================================================

router.get(
    "/seller/categories",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    getSellerCategories
);

router.get(
    "/seller/categories/:categoryId/subcategories",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    getSellerSubcategories
);

router.get(
    "/seller/brands",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    getSellerBrands
);

// =====================================================
// SELLER - MY PRODUCTS
// =====================================================

router.get(
    "/seller/my-products",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    getMyProducts
);

// =====================================================
// SELLER - CREATE PRODUCT
// =====================================================

router.post(
    "/",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    validateCreateProduct,
    createProduct
);

// =====================================================
// SELLER - UPDATE PRODUCT
// =====================================================

router.put(
    "/:productId",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    validateProductId,
    validateUpdateProduct,
    updateProduct
);

// =====================================================
// SELLER - TOGGLE STATUS
// =====================================================

router.patch(
    "/:productId/toggle-status",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    validateProductId,
    toggleProductStatus
);

// =====================================================
// SELLER - DELETE PRODUCT
// =====================================================

router.delete(
    "/:productId",
    authMiddleware,
    authorizeRoles("seller"),
    productLimiter,
    validateProductId,
    deleteProduct
);

// =====================================================
// AUTHENTICATED - ALL PRODUCTS
// =====================================================

router.get(
    "/",
    authMiddleware,
    productLimiter,
    getAllProducts
);

// =====================================================
// SINGLE PRODUCT
// MUST BE AFTER /seller ROUTES
// =====================================================

router.get(
    "/:productId",
    productLimiter,
    validateProductId,
    getProductById
);

module.exports = router;