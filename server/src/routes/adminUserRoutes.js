const express = require("express");

const router =
    express.Router();


// =====================================================
// CONTROLLER
// =====================================================

const {

    getAllUsers,

    getUserById,

    updateUser,

    blockUser,

    unblockUser,

    deleteUser,

} = require(
    "../controllers/admin/adminUserController"
);


// =====================================================
// MIDDLEWARE
// =====================================================

const authMiddleware =
    require(
        "../middleware/authMiddleware"
    );

const authorizeRoles =
    require(
        "../middleware/roleMiddleware"
    );

const {

    adminLimiter,

} = require(
    "../middleware/rateLimitterMiddleware"
);

const validateRequest =
    require(
        "../middleware/validateRequest"
    );


// =====================================================
// VALIDATORS
// =====================================================

const {

    validateUserId,

    validateUpdateUser,

    validateAdminUserQuery,

} = require(
    "../validator/adminUserValidator"
);


// =====================================================
// ADMIN PROTECTION
// =====================================================

router.use(

    authMiddleware,

    authorizeRoles("admin"),

    adminLimiter

);


// =====================================================
// GET ALL USERS
// GET /api/admin/users
//
// Query:
// ?page=1
// &limit=10
// &search=kartik
// &role=user
// &isBlocked=false
// =====================================================

router.get(

    "/users",

    validateAdminUserQuery,

    validateRequest,

    getAllUsers

);


// =====================================================
// GET SINGLE USER
// GET /api/admin/users/:userId
// =====================================================

router.get(

    "/users/:userId",

    validateUserId,

    validateRequest,

    getUserById

);


// =====================================================
// UPDATE USER
// PUT /api/admin/users/:userId
// =====================================================

router.put(

    "/users/:userId",

    validateUserId,

    validateUpdateUser,

    validateRequest,

    updateUser

);


// =====================================================
// BLOCK USER
// PATCH /api/admin/users/:userId/block
// =====================================================

router.patch(

    "/users/:userId/block",

    validateUserId,

    validateRequest,

    blockUser

);


// =====================================================
// UNBLOCK USER
// PATCH /api/admin/users/:userId/unblock
// =====================================================

router.patch(

    "/users/:userId/unblock",

    validateUserId,

    validateRequest,

    unblockUser

);


// =====================================================
// DELETE USER
// DELETE /api/admin/users/:userId
// =====================================================

router.delete(

    "/users/:userId",

    validateUserId,

    validateRequest,

    deleteUser

);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;