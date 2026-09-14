const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
    createSeller,
    getMySeller,
    updateMySeller,
    deleteMySeller,

    getAllSellers,
    getSellerById,

    approveSeller,
    rejectSeller,

    activateSeller,
    deactivateSeller,

    blockSeller,
    unblockSeller,
} = require(
    "../controllers/seller/sellerController"
);

// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const authorizeRoles = require(
    "../middleware/roleMiddleware"
);

const {
    sellerLimiter,
} = require(
    "../middleware/rateLimitterMiddleware"
);

const validateRequest = require(
    "../middleware/validateRequest"
);

// =====================================================
// VALIDATORS
// =====================================================

const {
    createSellerValidation,
    updateSellerValidation,

    sellerIdValidation,

    approveSellerValidation,
    rejectSellerValidation,

    activateSellerValidation,
    deactivateSellerValidation,

    blockSellerValidation,
    unblockSellerValidation,

    getAllSellersValidation,
} = require(
    "../validator/sellerValidator"
);

// =====================================================
// SELLER APPLICATION ROUTES
// =====================================================


// -----------------------------------------------------
// CREATE SELLER APPLICATION
// POST /api/seller
//
// Any authenticated normal user can apply.
// Admin accounts are blocked inside the controller.
// -----------------------------------------------------

router.post(
    "/",
    authMiddleware,
    sellerLimiter,
    createSellerValidation,
    validateRequest,
    createSeller
);


// -----------------------------------------------------
// GET MY SELLER APPLICATION / PROFILE
// GET /api/seller/me
//
// Allows pending and approved seller applicants.
// Controller checks whether Seller document exists.
// -----------------------------------------------------

router.get(
    "/me",
    authMiddleware,
    sellerLimiter,
    getMySeller
);


// -----------------------------------------------------
// UPDATE MY SELLER APPLICATION / PROFILE
// PUT /api/seller/me
//
// Allows seller applicants to update their information.
// -----------------------------------------------------

router.put(
    "/me",
    authMiddleware,
    sellerLimiter,
    updateSellerValidation,
    validateRequest,
    updateMySeller
);


// -----------------------------------------------------
// DELETE MY SELLER APPLICATION
// DELETE /api/seller/me
// -----------------------------------------------------

router.delete(
    "/me",
    authMiddleware,
    sellerLimiter,
    deleteMySeller
);


// =====================================================
// ADMIN SELLER MANAGEMENT
// =====================================================


// -----------------------------------------------------
// GET ALL SELLERS
// GET /api/seller/admin/all
// -----------------------------------------------------

router.get(
    "/admin/all",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    getAllSellersValidation,
    validateRequest,
    getAllSellers
);


// -----------------------------------------------------
// GET SELLER BY ID
// GET /api/seller/admin/:sellerId
// -----------------------------------------------------

router.get(
    "/admin/:sellerId",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    sellerIdValidation,
    validateRequest,
    getSellerById
);


// -----------------------------------------------------
// APPROVE SELLER
// PATCH /api/seller/admin/:sellerId/approve
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/approve",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    approveSellerValidation,
    validateRequest,
    approveSeller
);


// -----------------------------------------------------
// REJECT SELLER
// PATCH /api/seller/admin/:sellerId/reject
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/reject",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    rejectSellerValidation,
    validateRequest,
    rejectSeller
);


// -----------------------------------------------------
// ACTIVATE SELLER
// PATCH /api/seller/admin/:sellerId/activate
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/activate",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    activateSellerValidation,
    validateRequest,
    activateSeller
);


// -----------------------------------------------------
// DEACTIVATE SELLER
// PATCH /api/seller/admin/:sellerId/deactivate
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/deactivate",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    deactivateSellerValidation,
    validateRequest,
    deactivateSeller
);


// -----------------------------------------------------
// BLOCK SELLER
// PATCH /api/seller/admin/:sellerId/block
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/block",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    blockSellerValidation,
    validateRequest,
    blockSeller
);


// -----------------------------------------------------
// UNBLOCK SELLER
// PATCH /api/seller/admin/:sellerId/unblock
// -----------------------------------------------------

router.patch(
    "/admin/:sellerId/unblock",
    authMiddleware,
    authorizeRoles("admin"),
    sellerLimiter,
    unblockSellerValidation,
    validateRequest,
    unblockSeller
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;