const mongoose = require("mongoose");

const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");

const ApiError = require("../utils/ApiError");
const { getVariantPricing, calculateCouponDiscount } = require("../utils/pricing");

// =====================================================
// HELPERS
// =====================================================

const roundMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return NaN;
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
};

// -----------------------------------------------------
// Find Variant
// -----------------------------------------------------

const findVariant = (product, variantId) => {
  if (!product || !Array.isArray(product.variants) || !variantId) {
    return null;
  }

  return product.variants.find(
    (variant) =>
      variant?._id && variant._id.toString() === variantId.toString(),
  );
};

// =====================================================
// BUILD CHECKOUT
// =====================================================

const buildCheckout = async (userId, addressId, couponCode = "") => {
  // -------------------------------------------------
  // Authentication
  // -------------------------------------------------

  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  // -------------------------------------------------
  // Address Validation
  // -------------------------------------------------

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Valid addressId is required");
  }

  const address = await Address.findOne({
    _id: addressId,
    user: userId,
  }).lean();

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // -------------------------------------------------
  // Cart
  // -------------------------------------------------

  const cart = await Cart.findOne({
    user: userId,
  }).lean();

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  let coupon = null;
  const normalizedCouponCode = typeof couponCode === "string"
    ? couponCode.trim().toUpperCase()
    : "";

  if (normalizedCouponCode) {
    coupon = await Coupon.findOne({
      code: normalizedCouponCode,
      isActive: true,
    }).lean();

    if (!coupon) throw new ApiError(404, "Invalid or inactive coupon");

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new ApiError(400, "Coupon is not currently valid");
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit has been reached");
    }

    const previousUses = await Order.countDocuments({
      user: userId,
      couponCode: normalizedCouponCode,
      paymentStatus: "paid",
    });

    if (coupon.usageLimitPerUser !== null && previousUses >= coupon.usageLimitPerUser) {
      throw new ApiError(400, "You have already used this coupon the maximum allowed times");
    }
  }

  // -------------------------------------------------
  // Prepare
  // -------------------------------------------------

  const items = [];
  let subtotal = 0;
  let productDiscount = 0;
  let sellingSubtotal = 0;
  let applicableCouponAmount = 0;

  // -------------------------------------------------
  // Validate Cart Items
  // -------------------------------------------------

  for (const cartItem of cart.items) {
    const quantity = Number(cartItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Invalid cart quantity");
    }

    if (
      !cartItem.product ||
      !mongoose.Types.ObjectId.isValid(cartItem.product)
    ) {
      throw new ApiError(400, "Invalid product in cart");
    }

    if (
      !cartItem.variant ||
      !mongoose.Types.ObjectId.isValid(cartItem.variant)
    ) {
      throw new ApiError(400, "Invalid product variant in cart");
    }

    // -------------------------------------------------
    // Product
    // -------------------------------------------------

    const product = await Product.findOne({
      _id: cartItem.product,
      isDeleted: {
        $ne: true,
      },
    }).lean();

    if (!product) {
      throw new ApiError(
        404,
        "One of the products in your cart no longer exists",
      );
    }

    // -------------------------------------------------
    // Product Active
    // -------------------------------------------------

    if (!product.isActive) {
      throw new ApiError(400, `${product.name} is currently unavailable`);
    }

    // -------------------------------------------------
    // Variant
    // -------------------------------------------------

    const variant = findVariant(product, cartItem.variant);

    if (!variant) {
      throw new ApiError(404, `Variant for ${product.name} no longer exists`);
    }

    // -------------------------------------------------
    // Variant Active
    // -------------------------------------------------

    if (variant.isActive === false) {
      throw new ApiError(
        400,
        `Selected variant of ${product.name} is unavailable`,
      );
    }

    // -------------------------------------------------
    // Price
    // -------------------------------------------------

    let pricing;
    try {
      pricing = getVariantPricing(product, variant);
    } catch {
      throw new ApiError(400, `Invalid price for ${product.name}`);
    }

    const price = pricing.sellingPrice;

    // -------------------------------------------------
    // Stock
    // -------------------------------------------------

    const stock = Number(variant.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      throw new ApiError(400, `Invalid stock for ${product.name}`);
    }

    if (stock < quantity) {
      throw new ApiError(
        400,
        `Only ${stock} items of ${product.name} are available in stock`,
      );
    }

    // -------------------------------------------------
    // Item Total
    // -------------------------------------------------

    const mrpTotal = roundMoney(pricing.mrp * quantity);
    const productDiscountTotal = roundMoney(
      pricing.productDiscount * quantity,
    );
    const itemTotal = roundMoney(price * quantity);

    productDiscount = roundMoney(productDiscount + productDiscountTotal);
    sellingSubtotal = roundMoney(sellingSubtotal + itemTotal);

    if (!Number.isFinite(itemTotal)) {
      throw new ApiError(400, `Invalid item total for ${product.name}`);
    }

    subtotal = roundMoney(subtotal + mrpTotal);

    // -------------------------------------------------
    // Checkout Item
    // -------------------------------------------------

    items.push({
      cartItemId: cartItem._id,

      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        seller: product.seller,
      },

      variant: {
        _id: variant._id,
        sku: variant.sku,
        color: variant.color || "",
        size: variant.size || "",
        mrp: pricing.mrp,
        productDiscountPercent: pricing.discountPercent,
        productDiscount: productDiscountTotal,
        price,
        stock,
        image: variant.image || "",
      },

      quantity,

      mrpTotal,
      itemTotal,
    });
  }

  // -------------------------------------------------
  // Shipping
  // -------------------------------------------------

  let couponDiscount = 0;
  if (coupon) {
    if (sellingSubtotal < Number(coupon.minimumOrderAmount)) {
      throw new ApiError(400, `Minimum order amount of ${coupon.minimumOrderAmount} is required`);
    }
    if (applicableCouponAmount <= 0) {
      throw new ApiError(400, "Coupon is not applicable to products in your cart");
    }
    couponDiscount = calculateCouponDiscount({
      coupon,
      applicableAmount: applicableCouponAmount,
    });
  }

  const shipping = sellingSubtotal >= 999 ? 0 : 50;

  // -------------------------------------------------
  // Tax
  // -------------------------------------------------

  const tax = 0;

  // -------------------------------------------------
  // Total
  // -------------------------------------------------

  const total = roundMoney(sellingSubtotal - couponDiscount + shipping + tax);

  if (!Number.isFinite(total) || total < 0) {
    throw new ApiError(400, "Invalid checkout total");
  }

  // -------------------------------------------------
  // Response
  // -------------------------------------------------

  return {
    address: {
      _id: address._id,
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city,
      state: address.state,
      country: address.country || "India",
      postalCode: address.postalCode,
    },

    items,

    subtotal,
    productDiscount,
    sellingSubtotal,
    couponCode: normalizedCouponCode,
    couponDiscount,
    discount: productDiscount + couponDiscount,
    shipping,
    tax,
    total,

    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),

    itemCount: items.length,
  };
};

// =====================================================
// CHECKOUT SUMMARY
// POST /api/checkout/summary
// =====================================================

const getCheckoutSummary = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { addressId, couponCode = "" } = req.body;

    const summary = await buildCheckout(userId, addressId, couponCode);

    return res.status(200).json({
      success: true,
      message: "Checkout summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// CHECKOUT VALIDATION
// POST /api/checkout/validate
// =====================================================

const validateCheckoutData = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { addressId, paymentMethod, couponCode = "" } = req.body;

    const summary = await buildCheckout(userId, addressId, couponCode);

    if (
      paymentMethod !== undefined &&
      !["cod", "online"].includes(String(paymentMethod).trim().toLowerCase())
    ) {
      throw new ApiError(400, "Payment method must be either cod or online");
    }

    return res.status(200).json({
      success: true,

      message: "Checkout validated successfully",

      data: {
        valid: true,
        isValid: true,

        addressId,

        paymentMethod,

        subtotal: summary.subtotal,
        productDiscount: summary.productDiscount,
        sellingSubtotal: summary.sellingSubtotal,
        couponCode: summary.couponCode,
        couponDiscount: summary.couponDiscount,
        discount: summary.discount,
        shipping: summary.shipping,
        tax: summary.tax,
        total: summary.total,

        totalItems: summary.totalItems,
        itemCount: summary.itemCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getCheckoutSummary,
  validateCheckoutData,
};
