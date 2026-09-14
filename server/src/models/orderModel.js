const mongoose = require("mongoose");

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
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
        // SELLER REFERENCE
        // Product.seller stores User ID
        // -------------------------------------------------

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: [true, "Seller is required"],
        },

        // -------------------------------------------------
        // VARIANT REFERENCE
        // -------------------------------------------------

        variant: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Variant is required"],
        },

        // -------------------------------------------------
        // PRODUCT SNAPSHOT
        // -------------------------------------------------

        productName: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        productSlug: {
            type: String,
            required: [true, "Product slug is required"],
            trim: true,
        },

        // -------------------------------------------------
        // VARIANT SNAPSHOT
        // -------------------------------------------------

        sku: {
            type: String,
            required: [true, "Variant SKU is required"],
            trim: true,
            uppercase: true,
        },

        color: {
            type: String,
            trim: true,
            default: "",
        },

        size: {
            type: String,
            trim: true,
            default: "",
        },

        image: {
            type: String,
            trim: true,
            default: "",
        },

        // -------------------------------------------------
        // PRICE SNAPSHOT
        // -------------------------------------------------

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },

        // -------------------------------------------------
        // QUANTITY
        // -------------------------------------------------

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },

        // -------------------------------------------------
        // ITEM TOTAL
        // -------------------------------------------------

        itemTotal: {
            type: Number,
            required: [true, "Item total is required"],
            min: [0, "Item total cannot be negative"],
        },
    },
    {
        _id: true,
    }
);

// =====================================================
// SHIPPING ADDRESS SNAPSHOT
// =====================================================

const shippingAddressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        phone: {
            type: String,
            required: [true, "Phone is required"],
            trim: true,
        },

        addressLine1: {
            type: String,
            required: [true, "Address line 1 is required"],
            trim: true,
        },

        addressLine2: {
            type: String,
            trim: true,
            default: "",
        },

        landmark: {
            type: String,
            trim: true,
            default: "",
        },

        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
        },

        state: {
            type: String,
            required: [true, "State is required"],
            trim: true,
        },

        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
            default: "India",
        },

        postalCode: {
            type: String,
            required: [true, "Postal code is required"],
            trim: true,
        },
    },
    {
        _id: false,
    }
);

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
    {
        // -------------------------------------------------
        // ORDER NUMBER
        // -------------------------------------------------

        orderNumber: {
            type: String,
            required: [true, "Order number is required"],
            unique: true,
            index: true,
            trim: true,
            uppercase: true,
        },

        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        // -------------------------------------------------
        // ORDER ITEMS
        // -------------------------------------------------

        items: {
            type: [orderItemSchema],
            required: true,

            validate: {
                validator: function (items) {
                    return (
                        Array.isArray(items) &&
                        items.length > 0
                    );
                },

                message:
                    "Order must contain at least one item",
            },
        },

        // -------------------------------------------------
        // SHIPPING ADDRESS SNAPSHOT
        // -------------------------------------------------

        shippingAddress: {
            type: shippingAddressSchema,

            required: [
                true,
                "Shipping address is required",
            ],
        },

        // -------------------------------------------------
        // AMOUNTS
        // -------------------------------------------------

        subtotal: {
            type: Number,
            required: [true, "Subtotal is required"],
            min: [0, "Subtotal cannot be negative"],
        },

        shippingFee: {
            type: Number,
            default: 0,
            min: [0, "Shipping fee cannot be negative"],
        },

        discount: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
        },

        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"],
        },

        // -------------------------------------------------
        // PAYMENT METHOD
        // -------------------------------------------------

        paymentMethod: {
            type: String,

            enum: {
                values: [
                    "cod",
                    "online",
                ],

                message:
                    "Invalid payment method",
            },

            default: "cod",
        },

        // -------------------------------------------------
        // PAYMENT STATUS
        // -------------------------------------------------

        paymentStatus: {
            type: String,

            enum: {
                values: [
                    "pending",
                    "paid",
                    "failed",
                    "refunded",
                    "partially_refunded",
                ],

                message:
                    "Invalid payment status",
            },

            default: "pending",
            index: true,
        },

        // -------------------------------------------------
        // ORDER STATUS
        // -------------------------------------------------

        orderStatus: {
            type: String,

            enum: {
                values: [
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "out_for_delivery",
                    "delivered",
                    "cancelled",
                    "returned",
                    "refunded",
                ],

                message:
                    "Invalid order status",
            },

            default: "pending",
            index: true,
        },

        // -------------------------------------------------
        // CANCELLATION
        // -------------------------------------------------

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Cancellation reason cannot exceed 500 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // DELIVERY
        // -------------------------------------------------

        deliveredAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEXES
// =====================================================

// User orders

orderSchema.index({
    user: 1,
    createdAt: -1,
});

// Seller orders

orderSchema.index({
    "items.seller": 1,
    createdAt: -1,
});

// Order status

orderSchema.index({
    orderStatus: 1,
    createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Order =
    mongoose.models.Order ||
    mongoose.model(
        "Order",
        orderSchema
    );

// =====================================================
// EXPORT
// =====================================================

module.exports = Order;