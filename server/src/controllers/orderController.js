const mongoose = require("mongoose");

const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");

const ApiError = require("../utils/ApiError");
const Coupon = require("../models/couponModel");
const { getVariantPricing, calculateCouponDiscount } = require("../utils/pricing");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return Boolean(id && mongoose.Types.ObjectId.isValid(id));
};

const findVariant = (product, variantId) => {
  if (!product || !Array.isArray(product.variants) || !variantId) {
    return null;
  }

  return product.variants.find(
    (variant) =>
      variant?._id && variant._id.toString() === variantId.toString(),
  );
};

const roundMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return NaN;
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
};

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
};

const normalizePaymentMethod = (paymentMethod) => {
  if (typeof paymentMethod !== "string") {
    return null;
  }

  const normalized = paymentMethod.trim().toLowerCase();

  return ["cod", "online"].includes(normalized) ? normalized : null;
};

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?._id;

    const { addressId, paymentMethod = "cod", couponCode = "" } = req.body;

    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }

    if (!isValidObjectId(addressId)) {
      throw new ApiError(400, "Valid addressId is required");
    }

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    if (!normalizedPaymentMethod) {
      throw new ApiError(400, "Payment method must be either cod or online");
    }

    session.startTransaction();

    // -------------------------------------------------
    // Address
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    }).session(session);

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    // -------------------------------------------------
    // Cart
    // -------------------------------------------------

    const cart = await Cart.findOne({
      user: userId,
    }).session(session);

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    const orderItems = [];
    let subtotal = 0;
    let productDiscount = 0;

    // -------------------------------------------------
    // Validate Cart
    // -------------------------------------------------

    for (const cartItem of cart.items) {
      const quantity = Number(cartItem.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, "Invalid cart quantity");
      }

      if (!isValidObjectId(cartItem.product)) {
        throw new ApiError(400, "Invalid product in cart");
      }

      if (!isValidObjectId(cartItem.variant)) {
        throw new ApiError(400, "Invalid product variant in cart");
      }

      const product = await Product.findOne({
        _id: cartItem.product,
        isDeleted: {
          $ne: true,
        },
      }).session(session);

      if (!product) {
        throw new ApiError(
          404,
          "One of the products in your cart no longer exists",
        );
      }

      if (!product.isActive) {
        throw new ApiError(400, `${product.name} is currently unavailable`);
      }

      const variant = findVariant(product, cartItem.variant);

      if (!variant) {
        throw new ApiError(404, `Variant for ${product.name} no longer exists`);
      }

      if (variant.isActive === false) {
        throw new ApiError(
          400,
          `Selected variant of ${product.name} is unavailable`,
        );
      }

      let pricing;
      try {
        pricing = getVariantPricing(product, variant);
      } catch {
        throw new ApiError(400, `Invalid price for ${product.name}`);
      }

      const price = pricing.sellingPrice;

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

      const itemTotal = roundMoney(price * quantity);
      const mrpTotal = roundMoney(pricing.mrp * quantity);
      const itemProductDiscount = roundMoney(pricing.productDiscount * quantity);

      subtotal = roundMoney(subtotal + mrpTotal);
      productDiscount = roundMoney(productDiscount + itemProductDiscount);

      orderItems.push({
        product: product._id,

        // Seller._id
        seller: product.seller,

        variant: variant._id,

        productName: product.name,

        productSlug: product.slug,

        sku: variant.sku,

        color: variant.color || "",

        size: variant.size || "",

        image: variant.image || "",

        mrp: pricing.mrp,

        productDiscountPercent: pricing.discountPercent,

        productDiscount: itemProductDiscount,

        price,

        quantity,

        itemTotal,
      });
    }

    // -------------------------------------------------
    // Totals
    // -------------------------------------------------

    const sellingSubtotal = roundMoney(subtotal - productDiscount);

    let couponDiscount = 0;
    let normalizedCouponCode = "";

    if (couponCode) {
      normalizedCouponCode = String(couponCode).trim().toUpperCase();

      const coupon = await Coupon.findOne({
        code: normalizedCouponCode,
        isActive: true,
      }).session(session);

      if (!coupon) {
        throw new ApiError(404, "Invalid or inactive coupon");
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        throw new ApiError(400, "Coupon is not currently valid");
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, "Coupon usage limit has been reached");
      }

      if (coupon.usageLimitPerUser !== null) {
        const previousUses = await Order.countDocuments({
          user: userId,
          couponCode: normalizedCouponCode,
          paymentStatus: "paid",
        }).session(session);

        if (previousUses >= coupon.usageLimitPerUser) {
          throw new ApiError(400, "You have already used this coupon the maximum allowed times");
        }
      }

      if (sellingSubtotal < Number(coupon.minimumOrderAmount)) {
        throw new ApiError(400, `Minimum order amount of ${coupon.minimumOrderAmount} is required`);
      }

      let applicableAmount = 0;

      for (let i = 0; i < cart.items.length; i += 1) {
        const cartItem = cart.items[i];
        const orderItem = orderItems[i];
        const product = await Product.findById(cartItem.product).session(session);

        if (!product) continue;

        const productRestricted = coupon.applicableProducts.length > 0;
        const categoryRestricted = coupon.applicableCategories.length > 0;

        let applicable = true;
        if (productRestricted) {
          applicable = coupon.applicableProducts.some(
            (id) => id.toString() === product._id.toString(),
          );
        }
        if (applicable && categoryRestricted) {
          applicable = coupon.applicableCategories.some(
            (id) => id.toString() === product.category?.toString(),
          );
        }

        if (applicable) {
          applicableAmount = roundMoney(applicableAmount + orderItem.itemTotal);
        }
      }

      if (applicableAmount <= 0) {
        throw new ApiError(400, "Coupon is not applicable to products in your cart");
      }

      couponDiscount = calculateCouponDiscount({ coupon, applicableAmount });
    }

    const shippingFee = sellingSubtotal >= 999 ? 0 : 50;
    const discount = roundMoney(productDiscount + couponDiscount);
    const totalAmount = roundMoney(sellingSubtotal - couponDiscount + shippingFee);

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new ApiError(400, "Invalid order total");
    }

    // -------------------------------------------------
    // Address Snapshot
    // -------------------------------------------------

    const shippingAddress = {
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city,
      state: address.state,
      country: address.country || "India",
      postalCode: address.postalCode,
    };

    // -------------------------------------------------
    // Create Order
    // -------------------------------------------------

    const order = new Order({
      orderNumber: generateOrderNumber(),

      user: userId,

      items: orderItems,

      shippingAddress,

      subtotal,

      productDiscount,

      couponDiscount,

      discount,

      shippingFee,

      couponCode: normalizedCouponCode,

      totalAmount,

      paymentMethod: normalizedPaymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",
    });

    await order.save({
      session,
    });

    // -------------------------------------------------
    // Atomic Stock Deduction
    // -------------------------------------------------

    for (const cartItem of cart.items) {
      const quantity = Number(cartItem.quantity);

      const stockUpdate = await Product.updateOne(
        {
          _id: cartItem.product,

          isDeleted: {
            $ne: true,
          },

          isActive: true,

          variants: {
            $elemMatch: {
              _id: cartItem.variant,
              isActive: true,
              stock: {
                $gte: quantity,
              },
            },
          },
        },
        {
          $inc: {
            "variants.$.stock": -quantity,
          },
        },
      ).session(session);

      if (stockUpdate.modifiedCount !== 1) {
        throw new ApiError(
          409,
          "Stock changed while creating order. Please try again.",
        );
      }
    }

    // -------------------------------------------------
    // Clear Cart
    // -------------------------------------------------

    cart.items = [];

    await cart.save({
      session,
    });

    await session.commitTransaction();

    // -------------------------------------------------
    // Fetch Created Order
    // -------------------------------------------------

    const createdOrder = await Order.findById(order._id)
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .populate({
        path: "items.seller",
        select: "businessName businessEmail businessPhone verificationStatus",
        populate: {
          path: "user",
          select: "name email phone avatar",
        },
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: createdOrder,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const orders = await Order.find({
      user: userId,
    })
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    })
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .lean();

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    if (!userId) {
      throw new ApiError(401, "Authentication required");
    }

    if (!isValidObjectId(orderId)) {
      throw new ApiError(400, "Invalid order ID");
    }

    if (reason.length > 500) {
      throw new ApiError(
        400,
        "Cancellation reason cannot exceed 500 characters",
      );
    }

    session.startTransaction();

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    }).session(session);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.orderStatus === "cancelled") {
      throw new ApiError(400, "Order is already cancelled");
    }

    const cancellableStatuses = ["pending", "confirmed", "processing"];

    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new ApiError(
        400,
        `Order cannot be cancelled when status is ${order.orderStatus}`,
      );
    }

    // -------------------------------------------------
    // Restore Stock
    // -------------------------------------------------

    for (const item of order.items) {
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, `Invalid quantity for ${item.productName}`);
      }

      const stockRestore = await Product.updateOne(
        {
          _id: item.product,

          isDeleted: {
            $ne: true,
          },

          variants: {
            $elemMatch: {
              _id: item.variant,
            },
          },
        },
        {
          $inc: {
            "variants.$.stock": quantity,
          },
        },
      ).session(session);

      if (stockRestore.modifiedCount !== 1) {
        throw new ApiError(
          409,
          `Unable to restore stock for ${item.productName}`,
        );
      }
    }

    order.orderStatus = "cancelled";

    order.cancelledAt = new Date();

    order.cancellationReason = reason;

    // Payment refund remains separate.
    // Razorpay/payment module should
    // process the actual refund.

    await order.save({
      session,
    });

    await session.commitTransaction();

    const cancelledOrder = await Order.findById(order._id)
      .populate({
        path: "items.product",
        select: "name slug",
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelledOrder,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
