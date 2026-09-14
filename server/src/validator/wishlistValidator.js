const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

// =====================================================
// OBJECT ID VALIDATOR
// =====================================================

const validateObjectId = (
    value,
    fieldName
) => {
    if (!value) {
        throw new ApiError(
            400,
            `${fieldName} is required`
        );
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            value
        )
    ) {
        throw new ApiError(
            400,
            `Invalid ${fieldName}`
        );
    }

    return true;
};

// =====================================================
// PRODUCT ID VALIDATOR
// =====================================================

const validateProductId = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.productId,
            "product ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADD TO WISHLIST VALIDATOR
// =====================================================

const validateAddToWishlist = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.productId,
            "product ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// REMOVE FROM WISHLIST VALIDATOR
// =====================================================

const validateRemoveFromWishlist = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.productId,
            "product ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// CHECK WISHLIST VALIDATOR
// =====================================================

const validateCheckWishlist = (
    req,
    res,
    next
) => {
    try {
        validateObjectId(
            req.params.productId,
            "product ID"
        );

        next();
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateProductId,
    validateAddToWishlist,
    validateRemoveFromWishlist,
    validateCheckWishlist,
};