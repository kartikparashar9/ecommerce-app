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
      maxlength: [200, "Review title cannot exceed 200 characters"],
      default: "",
    },

    // -------------------------------------------------
    // REVIEW COMMENT
    // -------------------------------------------------

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [3, "Review comment must contain at least 3 characters"],
      maxlength: [2000, "Review comment cannot exceed 2000 characters"],
    },

    // -------------------------------------------------
    // MODERATION STATUS
    // -------------------------------------------------

    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
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
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
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
    // PURCHASE VERIFICATION
    // -------------------------------------------------

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// INDEXES
// =====================================================

// One user can create only one website review.

reviewSchema.index(
  {
    user: 1,
  },
  {
    unique: true,
  },
);

// -----------------------------------------------------
// Status + Created At
// -----------------------------------------------------

reviewSchema.index({
  status: 1,
  createdAt: -1,
});

// -----------------------------------------------------
// Rating + Status
// -----------------------------------------------------

reviewSchema.index({
  rating: 1,
  status: 1,
});

// -----------------------------------------------------
// User + Created At
// -----------------------------------------------------

reviewSchema.index({
  user: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

module.exports = Review;
