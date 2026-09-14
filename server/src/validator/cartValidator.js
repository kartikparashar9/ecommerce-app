const mongoose = require("mongoose");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// ADD TO CART VALIDATOR
// =====================================================

const validateAddToCart = (req, res, next) => {
    const {
        productId,
        variantId,
        quantity,
    } = req.body;

    // -------------------------------------------------
    // Product ID
    // -------------------------------------------------

    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required",
        });
    }

    if (!isValidObjectId(productId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID",
        });
    }

    // -------------------------------------------------
    // Variant ID
    // -------------------------------------------------

    if (!variantId) {
        return res.status(400).json({
            success: false,
            message: "Variant ID is required",
        });
    }

    if (!isValidObjectId(variantId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid variant ID",
        });
    }

    // -------------------------------------------------
    // Quantity
    // -------------------------------------------------

    if (
        quantity !== undefined &&
        (
            typeof quantity !== "number" ||
            !Number.isInteger(quantity) ||
            quantity < 1
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Quantity must be a positive integer",
        });
    }

    next();
};

// =====================================================
// UPDATE CART ITEM VALIDATOR
// =====================================================

const validateUpdateCartItem = (
    req,
    res,
    next
) => {
    const { quantity } = req.body;

    // -------------------------------------------------
    // Quantity Required
    // -------------------------------------------------

    if (quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: "Quantity is required",
        });
    }

    // -------------------------------------------------
    // Quantity Validation
    // -------------------------------------------------

    if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Quantity must be a positive integer",
        });
    }

    next();
};

// =====================================================
// CART ITEM ID VALIDATOR
// =====================================================

const validateCartItemId = (
    req,
    res,
    next
) => {
    const { itemId } = req.params;

    if (!itemId) {
        return res.status(400).json({
            success: false,
            message: "Cart item ID is required",
        });
    }

    if (!isValidObjectId(itemId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid cart item ID",
        });
    }

    next();
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    validateAddToCart,
    validateUpdateCartItem,
    validateCartItemId,
};