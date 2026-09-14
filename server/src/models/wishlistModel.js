const mongoose = require("mongoose");

// =====================================================
// WISHLIST ITEM SCHEMA
// =====================================================

const wishlistItemSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // Product Reference
        // -------------------------------------------------

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [
                true,
                "Product is required",
            ],
        },

        // -------------------------------------------------
        // Added At
        // -------------------------------------------------

        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

// =====================================================
// WISHLIST SCHEMA
// =====================================================

const wishlistSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // User
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [
                true,
                "User is required",
            ],
            unique: true,
            index: true,
        },

        // -------------------------------------------------
        // Wishlist Items
        // -------------------------------------------------

        items: {
            type: [wishlistItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEX
// =====================================================

// Prevent duplicate products inside one wishlist.

wishlistSchema.index(
    {
        user: 1,
        "items.product": 1,
    }
);

// =====================================================
// EXPORT
// =====================================================

const Wishlist =
    mongoose.models.Wishlist ||
    mongoose.model(
        "Wishlist",
        wishlistSchema
    );

module.exports = Wishlist;