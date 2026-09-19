const mongoose = require("mongoose");

const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const findVariant = (product, variantId) => {
  if (!product || !Array.isArray(product.variants) || !variantId) {
    return null;
  }

  return product.variants.find(
    (variant) => variant._id && variant._id.toString() === variantId.toString(),
  );
};

// =====================================================
// BUILD CHECKOUT
// =====================================================

const buildCheckout = async (userId, addressId) => {
  // -------------------------------------------------
  // USER
  // -------------------------------------------------

  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  // -------------------------------------------------
  // ADDRESS
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
  // CART
  // -------------------------------------------------

  const cart = await Cart.findOne({
    user: userId,
  }).lean();

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // -------------------------------------------------
  // PREPARE
  // -------------------------------------------------

  const items = [];

  let subtotal = 0;

  // -------------------------------------------------
  // VALIDATE CART ITEMS
  // -------------------------------------------------

  for (const cartItem of cart.items) {
    const quantity = Number(cartItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Invalid cart quantity");
    }

    // ---------------------------------------------
    // PRODUCT
    // ---------------------------------------------

    const product = await Product.findById(cartItem.product).lean();

    if (!product) {
      throw new ApiError(
        404,
        "One of the products in your cart no longer exists",
      );
    }

    // ---------------------------------------------
    // PRODUCT ACTIVE
    // ---------------------------------------------

    if (!product.isActive || product.isDeleted) {
      throw new ApiError(400, `${product.name} is currently unavailable`);
    }

    // ---------------------------------------------
    // VARIANT
    // ---------------------------------------------

    const variant = findVariant(product, cartItem.variant);

    if (!variant) {
      throw new ApiError(404, `Variant for ${product.name} no longer exists`);
    }

    // ---------------------------------------------
    // VARIANT ACTIVE
    // ---------------------------------------------

    if (!variant.isActive) {
      throw new ApiError(
        400,
        `Selected variant of ${product.name} is unavailable`,
      );
    }

    // ---------------------------------------------
    // PRICE
    // ---------------------------------------------

    const price = Number(variant.price);

    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(400, `Invalid price for ${product.name}`);
    }

    // ---------------------------------------------
    // STOCK
    // ---------------------------------------------

    const stock = Number(variant.stock) || 0;

    if (stock < quantity) {
      throw new ApiError(
        400,
        `Only ${stock} items of ${product.name} are available in stock`,
      );
    }

    // ---------------------------------------------
    // ITEM TOTAL
    // ---------------------------------------------

    const itemTotal = roundMoney(price * quantity);

    subtotal = roundMoney(subtotal + itemTotal);

    // ---------------------------------------------
    // CHECKOUT ITEM
    // ---------------------------------------------

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
        price,
        stock,
        image: variant.image || "",
      },

      quantity,

      itemTotal,
    });
  }

  // -------------------------------------------------
  // SHIPPING
  // -------------------------------------------------

  const shipping = subtotal >= 999 ? 0 : 50;

  // -------------------------------------------------
  // DISCOUNT
  // -------------------------------------------------

  // Coupon support can be connected here later.
  const discount = 0;

  // -------------------------------------------------
  // TAX
  // -------------------------------------------------

  // Existing order flow does not calculate tax.
  const tax = 0;

  // -------------------------------------------------
  // TOTAL
  // -------------------------------------------------

  const total = roundMoney(subtotal - discount + shipping + tax);

  if (!Number.isFinite(total) || total < 0) {
    throw new ApiError(400, "Invalid checkout total");
  }

  // -------------------------------------------------
  // RETURN
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

    discount,

    shipping,

    tax,

    total,

    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),

    itemCount: items.length,
  };
};

// =====================================================
// CHECKOUT SUMMARY
// =====================================================

// POST /api/checkout/summary

const getCheckoutSummary = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { addressId } = req.body;

    const summary = await buildCheckout(userId, addressId);

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
// =====================================================

// POST /api/checkout/validate

const validateCheckoutData = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { addressId, paymentMethod } = req.body;

    const summary = await buildCheckout(userId, addressId);

    return res.status(200).json({
      success: true,

      message: "Checkout validated successfully",

      data: {
        valid: true,

        isValid: true,

        addressId,

        paymentMethod,

        subtotal: summary.subtotal,

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
