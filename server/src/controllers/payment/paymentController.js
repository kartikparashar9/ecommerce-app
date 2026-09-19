const crypto = require("crypto");

const razorpay = require("../../config/razorpay");
const Payment = require("../../models/paymentModel");
const Order = require("../../models/orderModel");

const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { orderId } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    return next(new ApiError(404, "Order not found"));
  }

  if (order.paymentMethod !== "online") {
    return next(
      new ApiError(400, "Online payment is not available for this order"),
    );
  }

  if (order.paymentStatus === "paid") {
    return next(new ApiError(400, "Order has already been paid"));
  }

  const invalidStatuses = ["cancelled", "delivered", "returned", "refunded"];

  if (invalidStatuses.includes(order.orderStatus)) {
    return next(
      new ApiError(
        400,
        `Payment cannot be initiated for ${order.orderStatus} order`,
      ),
    );
  }

  const amount = Number(order.totalAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new ApiError(400, "Invalid order amount"));
  }

  const amountInPaise = Math.round(amount * 100);

  // =============================================
  // CHECK EXISTING PAYMENT
  // =============================================

  const existingPayment = await Payment.findOne({
    order: order._id,
    user: userId,
    paymentMethod: "online",
    status: {
      $in: ["pending", "processing"],
    },
  }).sort({
    createdAt: -1,
  });

  // =============================================
  // REUSE ONLY VALID RAZORPAY ORDER
  // =============================================

  if (existingPayment?.razorpayOrderId) {
    try {
      const razorpayOrder = await razorpay.orders.fetch(
        existingPayment.razorpayOrderId,
      );

      const sameAmount = Number(razorpayOrder.amount) === amountInPaise;

      const sameCurrency =
        String(razorpayOrder.currency).toUpperCase() === "INR";

      const usableStatus = ["created", "attempted"].includes(
        razorpayOrder.status,
      );

      if (sameAmount && sameCurrency && usableStatus) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              paymentId: existingPayment._id,

              orderId: order._id,

              orderNumber: order.orderNumber,

              razorpayOrderId: razorpayOrder.id,

              amount: razorpayOrder.amount,

              currency: razorpayOrder.currency,

              keyId: process.env.RAZORPAY_KEY_ID,
            },
            "Existing Razorpay order retrieved successfully",
          ),
        );
      }

      // =====================================
      // RAZORPAY ORDER ALREADY PAID
      // =====================================

      if (razorpayOrder.status === "paid") {
        return next(
          new ApiError(409, "This Razorpay order has already been paid"),
        );
      }
    } catch (error) {
      console.error("Existing Razorpay order validation failed:", error);
    }

    existingPayment.status = "failed";
    existingPayment.failureReason =
      "Previous Razorpay order is no longer usable";

    await existingPayment.save();
  }

  // =============================================
  // CREATE NEW RAZORPAY ORDER
  // =============================================

  let razorpayOrder;

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",

      receipt: `order_${order.orderNumber}`,

      notes: {
        orderId: order._id.toString(),

        orderNumber: order.orderNumber,

        userId: userId.toString(),
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return next(new ApiError(502, "Unable to create Razorpay order"));
  }

  console.log("RAZORPAY ORDER CREATED:", {
    id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    status: razorpayOrder.status,
  });

  // =============================================
  // SAVE PAYMENT
  // =============================================

  const payment = await Payment.create({
    order: order._id,
    user: userId,
    amount,
    currency: "INR",
    paymentMethod: "online",
    gateway: "razorpay",
    status: "pending",
    razorpayOrderId: razorpayOrder.id,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        paymentId: payment._id,

        orderId: order._id,

        orderNumber: order.orderNumber,

        razorpayOrderId: razorpayOrder.id,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        keyId: process.env.RAZORPAY_KEY_ID,
      },
      "Razorpay order created successfully",
    ),
  );
});

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body;

  const payment = await Payment.findOne({
    razorpayOrderId,
    user: userId,
  });

  if (!payment) {
    return next(new ApiError(404, "Payment record not found"));
  }

  // =========================================
  // VERIFY PAYMENT BELONGS TO ORDER
  // =========================================

  if (String(payment.order) !== String(orderId)) {
    return next(new ApiError(400, "Payment and order do not match"));
  }

  // =========================================
  // ALREADY SUCCESSFUL
  // =========================================

  if (payment.status === "success") {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          paymentId: payment._id,

          orderId: payment.order,

          status: payment.status,
        },
        "Payment already verified",
      ),
    );
  }

  // =========================================
  // SIGNATURE
  // =========================================

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature.length !== razorpaySignature.length) {
    payment.status = "failed";

    payment.failureReason = "Invalid Razorpay payment signature";

    await payment.save();

    return next(new ApiError(400, "Payment verification failed"));
  }

  const isValidSignature = crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(razorpaySignature),
  );

  if (!isValidSignature) {
    payment.status = "failed";

    payment.failureReason = "Invalid Razorpay payment signature";

    await payment.save();

    return next(new ApiError(400, "Payment verification failed"));
  }

  // =========================================
  // FIND ORDER
  // =========================================

  const order = await Order.findOne({
    _id: payment.order,
    user: userId,
  });

  if (!order) {
    return next(new ApiError(404, "Associated order not found"));
  }

  // =========================================
  // FETCH PAYMENT FROM RAZORPAY
  // =========================================

  let razorpayPayment;

  try {
    razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
  } catch (error) {
    console.error("Razorpay payment fetch error:", error);

    return next(new ApiError(502, "Unable to verify Razorpay payment"));
  }

  // =========================================
  // VERIFY ORDER ID
  // =========================================

  if (razorpayPayment.order_id !== razorpayOrderId) {
    payment.status = "failed";

    payment.failureReason = "Razorpay payment order mismatch";

    await payment.save();

    return next(new ApiError(400, "Razorpay payment order mismatch"));
  }

  // =========================================
  // VERIFY AMOUNT
  // =========================================

  const expectedAmount = Math.round(Number(order.totalAmount) * 100);

  if (Number(razorpayPayment.amount) !== expectedAmount) {
    payment.status = "failed";

    payment.failureReason = "Razorpay payment amount mismatch";

    await payment.save();

    return next(new ApiError(400, "Razorpay payment amount mismatch"));
  }

  // =========================================
  // VERIFY CURRENCY
  // =========================================

  if (String(razorpayPayment.currency).toUpperCase() !== "INR") {
    payment.status = "failed";

    payment.failureReason = "Invalid Razorpay payment currency";

    await payment.save();

    return next(new ApiError(400, "Invalid payment currency"));
  }

  // =========================================
  // PAYMENT MUST BE CAPTURED
  // =========================================

  if (razorpayPayment.status !== "captured") {
    payment.status = "failed";

    payment.failureReason = `Razorpay payment status is ${razorpayPayment.status}`;

    await payment.save();

    return next(new ApiError(400, "Payment has not been captured"));
  }

  // =========================================
  // SUCCESS
  // =========================================

  payment.razorpayPaymentId = razorpayPaymentId;

  payment.status = "success";

  payment.failureReason = "";

  payment.paidAt = new Date();

  await payment.save();

  // =========================================
  // UPDATE ORDER
  // =========================================

  order.paymentStatus = "paid";

  if (order.orderStatus === "pending") {
    order.orderStatus = "confirmed";
  }

  await order.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentId: payment._id,

        orderId: order._id,

        orderNumber: order.orderNumber,

        razorpayOrderId,

        razorpayPaymentId,

        paymentStatus: payment.status,

        orderStatus: order.orderStatus,
      },
      "Payment verified successfully",
    ),
  );
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
