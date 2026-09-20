const mongoose = require("mongoose");

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // COUPON CODE
    // -------------------------------------------------

    code: {
      type: String,
      required: [true, "Coupon code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [50, "Coupon code cannot exceed 50 characters"],
    },

    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // -------------------------------------------------
    // DISCOUNT TYPE
    // -------------------------------------------------

    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "Discount type must be percentage or fixed",
      },
      required: true,
    },

    // -------------------------------------------------
    // DISCOUNT VALUE
    // -------------------------------------------------

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },

    // -------------------------------------------------
    // MAXIMUM DISCOUNT
    // -------------------------------------------------

    maximumDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cannot be negative"],
    },

    // -------------------------------------------------
    // MINIMUM ORDER AMOUNT
    // -------------------------------------------------

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },

    // -------------------------------------------------
    // USAGE LIMIT
    // -------------------------------------------------

    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
      validate: {
        validator: function (value) {
          return value === null || Number.isInteger(value);
        },
        message: "Usage limit must be an integer",
      },
    },

    // -------------------------------------------------
    // USED COUNT
    // -------------------------------------------------

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Used count must be an integer",
      },
    },

    // -------------------------------------------------
    // PER USER USAGE LIMIT
    // -------------------------------------------------

    usageLimitPerUser: {
      type: Number,
      default: 1,
      min: [1, "Per-user usage limit must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Per-user usage limit must be an integer",
      },
    },

    // -------------------------------------------------
    // VALIDITY
    // -------------------------------------------------

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // -------------------------------------------------
    // APPLICABLE CATEGORIES
    // Empty = all categories
    // -------------------------------------------------

    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    // -------------------------------------------------
    // APPLICABLE PRODUCTS
    // Empty = all products
    // -------------------------------------------------

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // -------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------

    isActive: {
      type: Boolean,
      default: true,
    },

    // -------------------------------------------------
    // CREATED BY ADMIN
    // -------------------------------------------------

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// VALIDATE COUPON
// =====================================================

couponSchema.pre("validate", function (next) {
  // Date validation
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error("End date must be after start date"));
  }

  // Percentage must be 0-100
  if (this.discountType === "percentage" && this.discountValue > 100) {
    return next(new Error("Percentage discount cannot exceed 100%"));
  }

  // Maximum discount only makes sense for percentage coupons
  if (this.discountType === "fixed" && this.maximumDiscount !== null) {
    return next(
      new Error("Maximum discount is only valid for percentage coupons"),
    );
  }

  // Maximum discount should not be zero/negative
  if (this.maximumDiscount !== null && this.maximumDiscount < 0) {
    return next(new Error("Maximum discount cannot be negative"));
  }

  next();
});

// =====================================================
// INDEXES
// =====================================================

// code index is already created by unique: true

couponSchema.index({
  isActive: 1,
  startDate: 1,
  endDate: 1,
});

// =====================================================
// EXPORT
// =====================================================

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
