const mongoose = require("mongoose");

// =====================================================
// REVIEW SCHEMA
// =====================================================

const reviewSchema = new mongoose.Schema(
    {
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
        // PRODUCT
        // -------------------------------------------------

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
            index: true,
        },

        // -------------------------------------------------
        // ORDER
        // -------------------------------------------------
        // Used to verify that the user actually purchased
        // the product.

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order is required"],
            index: true,
        },

        // -------------------------------------------------
        // VARIANT
        // -------------------------------------------------
        // Optional because a product may have multiple
        // variants.

        variant: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        // -------------------------------------------------
        // RATING
        // -------------------------------------------------

        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number from 1 to 5",
            },
        },

        // -------------------------------------------------
        // REVIEW TITLE
        // -------------------------------------------------

        title: {
            type: String,
            trim: true,
            maxlength: [
                200,
                "Review title cannot exceed 200 characters",
            ],
            default: "",
        },

        // -------------------------------------------------
        // REVIEW COMMENT
        // -------------------------------------------------

        comment: {
            type: String,
            required: [true, "Review comment is required"],
            trim: true,
            minlength: [
                3,
                "Review comment must contain at least 3 characters",
            ],
            maxlength: [
                2000,
                "Review comment cannot exceed 2000 characters",
            ],
        },

        // -------------------------------------------------
        // MODERATION STATUS
        // -------------------------------------------------

        status: {
            type: String,
            enum: {
                values: [
                    "pending",
                    "approved",
                    "rejected",
                ],
                message: "Invalid review status",
            },
            default: "approved",
            index: true,
        },

        // -------------------------------------------------
        // ADMIN MODERATION
        // -------------------------------------------------

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Rejection reason cannot exceed 500 characters",
            ],
            default: "",
        },

        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        moderatedAt: {
            type: Date,
            default: null,
        },

        // -------------------------------------------------
        // HELPERS
        // -------------------------------------------------

        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// =====================================================
// INDEXES
// =====================================================

// One user can review a product only once.
//
// If you want variant-specific reviews later,
// this can be changed to user + product + variant.
reviewSchema.index(
    {
        user: 1,
        product: 1,
    },
    {
        unique: true,
    }
);

reviewSchema.index({
    product: 1,
    status: 1,
    createdAt: -1,
});

reviewSchema.index({
    user: 1,
    createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Review =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema);

module.exports = Review;