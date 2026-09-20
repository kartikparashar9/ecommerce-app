const mongoose = require("mongoose");

// =====================================================
// CART ITEM SCHEMA
// =====================================================

const cartItemSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // PRODUCT REFERENCE
    // -------------------------------------------------

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // -------------------------------------------------
    // VARIANT REFERENCE
    // -------------------------------------------------

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Product variant is required"],
    },

    // -------------------------------------------------
    // QUANTITY
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
  },
);

// =====================================================
// CART SCHEMA
// =====================================================

const cartSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // USER
    // -------------------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },

    // -------------------------------------------------
    // CART ITEMS
    // -------------------------------------------------

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// EXPORT
// =====================================================

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

module.exports = Cart;
