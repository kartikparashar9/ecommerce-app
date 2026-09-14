const mongoose = require("mongoose");

// =====================================================
// CART ITEM SCHEMA
// =====================================================

const cartItemSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // Product Reference
        // -------------------------------------------------

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },

        // -------------------------------------------------
        // Variant Reference
        // -------------------------------------------------

        variant: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Product variant is required"],
        },

        // -------------------------------------------------
        // Quantity
        // -------------------------------------------------

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be an integer",
            },
        },
    },
    {
        _id: true,
    }
);

// =====================================================
// CART SCHEMA
// =====================================================

const cartSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // User
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
            index: true,
        },

        // -------------------------------------------------
        // Cart Items
        // -------------------------------------------------

        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// EXPORT
// =====================================================

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;