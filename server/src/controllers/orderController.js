const mongoose = require("mongoose");

const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// ObjectId Validation
// -----------------------------------------------------

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// -----------------------------------------------------
// Find Variant
// -----------------------------------------------------

const findVariant = (product, variantId) => {
  if (!product || !Array.isArray(product.variants) || !variantId) {
    return null;
  }

  return product.variants.find(
    (variant) => variant._id && variant._id.toString() === variantId.toString(),
  );
};

// -----------------------------------------------------
// Round Money
// -----------------------------------------------------

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

// -----------------------------------------------------
// Generate Order Number
// -----------------------------------------------------

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(100000 + Math.random() * 900000);

  return `ORD-${timestamp}-${random}`;
};

// -----------------------------------------------------
// Normalize Payment Method
// -----------------------------------------------------

const normalizePaymentMethod = (paymentMethod) => {
  if (typeof paymentMethod !== "string") {
    return null;
  }

  const normalized = paymentMethod.trim().toLowerCase();

  if (!["cod", "online"].includes(normalized)) {
    return null;
  }

  return normalized;
};

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?._id;

    const { addressId, paymentMethod = "cod" } = req.body;

    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Validate Address ID
    // -------------------------------------------------

    if (!addressId || !isValidObjectId(addressId)) {
      return next(new ApiError(400, "Valid addressId is required"));
    }

    // -------------------------------------------------
    // Validate Payment Method
    // -------------------------------------------------

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    if (!normalizedPaymentMethod) {
      return next(
        new ApiError(400, "Payment method must be either cod or online"),
      );
    }

    // -------------------------------------------------
    // Start Transaction
    // -------------------------------------------------

    session.startTransaction();

    // -------------------------------------------------
    // Find Address
    // -------------------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    }).session(session);

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    // -------------------------------------------------
    // Find Cart
    // -------------------------------------------------

    const cart = await Cart.findOne({
      user: userId,
    }).session(session);

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    // -------------------------------------------------
    // Prepare
    // -------------------------------------------------

    const orderItems = [];

    let subtotal = 0;

    // -------------------------------------------------
    // Validate Cart Items
    // -------------------------------------------------

    for (const cartItem of cart.items) {
      // ---------------------------------------------
      // Validate Quantity
      // ---------------------------------------------

      const quantity = Number(cartItem.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, "Invalid cart quantity");
      }

      // ---------------------------------------------
      // Product
      // ---------------------------------------------

      const product = await Product.findById(cartItem.product).session(session);

      if (!product) {
        throw new ApiError(
          404,
          "One of the products in your cart no longer exists",
        );
      }

      // ---------------------------------------------
      // Product Active
      // ---------------------------------------------

      if (!product.isActive) {
        throw new ApiError(400, `${product.name} is currently unavailable`);
      }

      // ---------------------------------------------
      // Variant
      // ---------------------------------------------

      const variant = findVariant(product, cartItem.variant);

      if (!variant) {
        throw new ApiError(404, `Variant for ${product.name} no longer exists`);
      }

      // ---------------------------------------------
      // Variant Active
      // ---------------------------------------------

      if (!variant.isActive) {
        throw new ApiError(
          400,
          `Selected variant of ${product.name} is unavailable`,
        );
      }

      // ---------------------------------------------
      // Price
      // ---------------------------------------------

      const price = Number(variant.price);

      if (!Number.isFinite(price) || price < 0) {
        throw new ApiError(400, `Invalid price for ${product.name}`);
      }

      // ---------------------------------------------
      // Stock Validation
      // ---------------------------------------------

      const stock = Number(variant.stock) || 0;

      if (stock < quantity) {
        throw new ApiError(
          400,
          `Only ${stock} items of ${product.name} are available in stock`,
        );
      }

      // ---------------------------------------------
      // Item Total
      // ---------------------------------------------

      const itemTotal = roundMoney(price * quantity);

      subtotal = roundMoney(subtotal + itemTotal);

      // ---------------------------------------------
      // Snapshot
      // ---------------------------------------------

      orderItems.push({
        product: product._id,

        // Product.seller must contain
        // Seller._id because Order.items.seller
        // now references Seller.
        seller: product.seller,

        variant: variant._id,

        productName: product.name,

        productSlug: product.slug,

        sku: variant.sku,

        color: variant.color || "",

        size: variant.size || "",

        image: variant.image || "",

        price,

        quantity,

        itemTotal,
      });
    }

    // -------------------------------------------------
    // Shipping Fee
    // -------------------------------------------------

    const shippingFee = subtotal >= 999 ? 0 : 50;

    // -------------------------------------------------
    // Discount
    // -------------------------------------------------

    // Coupon module will modify this later.
    const discount = 0;

    // -------------------------------------------------
    // Total
    // -------------------------------------------------

    const totalAmount = roundMoney(subtotal + shippingFee - discount);

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new ApiError(400, "Invalid order total");
    }

    // -------------------------------------------------
    // Shipping Address Snapshot
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

      shippingFee,

      discount,

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

      const productId = cartItem.product;

      const variantId = cartItem.variant;

      const stockUpdate = await Product.updateOne(
        {
          _id: productId,

          isActive: true,

          variants: {
            $elemMatch: {
              _id: variantId,
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

    // -------------------------------------------------
    // Commit
    // -------------------------------------------------

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
        // Order.items.seller → Seller._id
        path: "items.seller",
        select: "businessName businessEmail businessPhone verificationStatus",
        populate: {
          // Seller.user → User._id
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
      return next(new ApiError(401, "Authentication required"));
    }

    if (!isValidObjectId(orderId)) {
      return next(new ApiError(400, "Invalid order ID"));
    }

    if (reason.length > 500) {
      return next(
        new ApiError(400, "Cancellation reason cannot exceed 500 characters"),
      );
    }

    session.startTransaction();

    // -------------------------------------------------
    // Find Order
    // -------------------------------------------------

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    }).session(session);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // -------------------------------------------------
    // Already Cancelled
    // -------------------------------------------------

    if (order.orderStatus === "cancelled") {
      throw new ApiError(400, "Order is already cancelled");
    }

    // -------------------------------------------------
    // Cancellation Rules
    // -------------------------------------------------

    const cancellableStatuses = ["pending", "confirmed", "processing"];

    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new ApiError(
        400,
        `Order cannot be cancelled when status is ${order.orderStatus}`,
      );
    }

    // -------------------------------------------------
    // Restore Stock Atomically
    // -------------------------------------------------

    for (const item of order.items) {
      const quantity = Number(item.quantity);

      const stockRestore = await Product.updateOne(
        {
          _id: item.product,

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

    // -------------------------------------------------
    // Update Order
    // -------------------------------------------------

    order.orderStatus = "cancelled";

    order.cancelledAt = new Date();

    order.cancellationReason = reason;

    // -------------------------------------------------
    // IMPORTANT PAYMENT RULE
    // -------------------------------------------------

    /*
     * Do NOT directly change:
     *
     * paid -> refunded
     *
     * here.
     *
     * Actual refund must be processed by
     * Payment module/Razorpay and then
     * paymentStatus should be updated.
     */

    await order.save({
      session,
    });

    // -------------------------------------------------
    // Commit
    // -------------------------------------------------

    await session.commitTransaction();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

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
