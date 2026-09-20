const mongoose = require("mongoose");

// =====================================================
// PRODUCT VARIANT SCHEMA
// =====================================================

const productVariantSchema = new mongoose.Schema(
  {
    // -------------------------------------------------
    // SKU
    // -------------------------------------------------

    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Variant SKU must be at least 2 characters"],
      maxlength: [100, "Variant SKU cannot exceed 100 characters"],
    },

    // -------------------------------------------------
    // COLOR
    // -------------------------------------------------

    color: {
      type: String,
      trim: true,
      maxlength: [50, "Color cannot exceed 50 characters"],
      default: "",
    },

    // -------------------------------------------------
    // SIZE
    // -------------------------------------------------

    size: {
      type: String,
      trim: true,
      maxlength: [50, "Size cannot exceed 50 characters"],
      default: "",
    },

    // -------------------------------------------------
    // PRICE
    // -------------------------------------------------

    price: {
      type: Number,
      required: [true, "Variant price is required"],
      min: [0, "Variant price cannot be negative"],
    },

    // -------------------------------------------------
    // STOCK
    // -------------------------------------------------

    stock: {
      type: Number,
      required: [true, "Variant stock is required"],
      min: [0, "Variant stock cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Variant stock must be an integer",
      },
    },

    // -------------------------------------------------
    // IMAGE
    // -------------------------------------------------

    image: {
      type: String,
      trim: true,
      maxlength: [1000, "Variant image URL cannot exceed 1000 characters"],
      default: "",
    },

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  },
);

// =====================================================
// PRODUCT SCHEMA
// =====================================================

const productSchema = new mongoose.Schema(
  {
    // =================================================
    // BASIC INFORMATION
    // =================================================

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    // -------------------------------------------------
    // SLUG
    // -------------------------------------------------

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // -------------------------------------------------
    // SHORT DESCRIPTION
    // -------------------------------------------------

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
      default: "",
    },

    // =================================================
    // CATEGORY
    // =================================================

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },

    // -------------------------------------------------
    // SUBCATEGORY
    // -------------------------------------------------

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    // =================================================
    // BRAND
    // =================================================

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
      index: true,
    },

    // =================================================
    // SELLER
    // =================================================

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
      index: true,
    },

    // =================================================
    // PRODUCT IMAGES
    // =================================================

    images: {
      type: [String],
      default: [],

      validate: {
        validator: function (images) {
          return Array.isArray(images) && images.length <= 10;
        },

        message: "Product cannot have more than 10 images",
      },
    },

    // =================================================
    // PRICING
    // =================================================

    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },

    // -------------------------------------------------
    // PRODUCT DISCOUNT
    // -------------------------------------------------

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    // -------------------------------------------------
    // FINAL SELLING PRICE
    // -------------------------------------------------

    finalPrice: {
      type: Number,
      required: [true, "Final price is required"],
      min: [0, "Final price cannot be negative"],
    },

    // =================================================
    // INVENTORY
    // =================================================

    totalStock: {
      type: Number,
      default: 0,
      min: [0, "Total stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total stock must be an integer",
      },
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, "Low stock threshold cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Low stock threshold must be an integer",
      },
    },

    // =================================================
    // VARIANTS
    // =================================================

    variants: {
      type: [productVariantSchema],
      default: [],
    },

    // =================================================
    // ATTRIBUTES
    // =================================================

    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    // =================================================
    // PRODUCT STATUS
    // =================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // =================================================
    // SOFT DELETE
    // =================================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // =================================================
    // STATISTICS
    // =================================================

    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: [0, "Total reviews cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total reviews must be an integer",
      },
    },

    totalSold: {
      type: Number,
      default: 0,
      min: [0, "Total sold cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total sold must be an integer",
      },
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// PRE VALIDATION - PRODUCT PRICE
// =====================================================

productSchema.pre("validate", function (next) {
  const basePrice = Number(this.basePrice);
  const discount = Number(this.discount ?? 0);

  if (!Number.isFinite(basePrice)) {
    return next(new Error("Base price must be a valid number"));
  }

  if (!Number.isFinite(discount)) {
    return next(new Error("Discount must be a valid number"));
  }

  const calculatedPrice = Number(
    (basePrice - (basePrice * discount) / 100).toFixed(2),
  );

  if (this.finalPrice === undefined || this.finalPrice === null) {
    this.finalPrice = calculatedPrice;
  } else {
    const providedFinalPrice = Number(this.finalPrice);

    if (!Number.isFinite(providedFinalPrice)) {
      return next(new Error("Final price must be a valid number"));
    }

    if (Math.abs(providedFinalPrice - calculatedPrice) > 0.01) {
      return next(
        new Error("Final price does not match base price and discount"),
      );
    }

    this.finalPrice = calculatedPrice;
  }

  next();
});

// =====================================================
// INDEXES
// =====================================================

// Search
productSchema.index({
  name: "text",
  description: "text",
  shortDescription: "text",
});

// Category + Brand
productSchema.index({
  category: 1,
  brand: 1,
});

// Seller Products
productSchema.index({
  seller: 1,
  createdAt: -1,
});

// Seller + Active
productSchema.index({
  seller: 1,
  isActive: 1,
  isDeleted: 1,
});

// Public Products
productSchema.index({
  isActive: 1,
  isDeleted: 1,
  createdAt: -1,
});

// Featured Products
productSchema.index({
  isFeatured: 1,
  isActive: 1,
  isDeleted: 1,
});

// =====================================================
// EXPORT
// =====================================================

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
