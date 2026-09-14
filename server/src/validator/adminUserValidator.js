const {
    param,
    body,
    query,
} = require("express-validator");


// =====================================================
// USER ID
// =====================================================

const validateUserId = [

    param("userId")
        .isMongoId()
        .withMessage(
            "Invalid user ID"
        ),

];


// =====================================================
// UPDATE USER
// =====================================================

const validateUpdateUser = [

    body("name")
        .optional()
        .trim()
        .isLength({
            min: 2,
            max: 100,
        })
        .withMessage(
            "Name must be between 2 and 100 characters"
        ),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage(
            "Please provide a valid email"
        )
        .normalizeEmail(),

    body("phone")
        .optional()
        .trim()
        .matches(
            /^[6-9]\d{9}$/
        )
        .withMessage(
            "Please provide a valid 10-digit Indian phone number"
        ),

    body("gender")
        .optional()
        .isIn([
            "male",
            "female",
        ])
        .withMessage(
            "Gender must be male or female"
        ),

    body("avatar")
        .optional()
        .trim()
        .isString()
        .withMessage(
            "Avatar must be a string"
        ),

];


// =====================================================
// USER QUERY
// =====================================================

const validateAdminUserQuery = [

    query("page")
        .optional()
        .isInt({
            min: 1,
        })
        .withMessage(
            "Page must be at least 1"
        ),

    query("limit")
        .optional()
        .isInt({
            min: 1,
            max: 100,
        })
        .withMessage(
            "Limit must be between 1 and 100"
        ),

    query("role")
        .optional()
        .isIn([
            "user",
            "seller",
            "admin",
        ])
        .withMessage(
            "Invalid role"
        ),

    query("isBlocked")
        .optional()
        .isBoolean()
        .withMessage(
            "isBlocked must be true or false"
        ),

    query("search")
        .optional()
        .trim()
        .isLength({
            max: 100,
        })
        .withMessage(
            "Search cannot exceed 100 characters"
        ),

];


module.exports = {

    validateUserId,

    validateUpdateUser,

    validateAdminUserQuery,

};