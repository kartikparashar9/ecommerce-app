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

const createRazorpayOrder = asyncHandler(
    async (req, res, next) => {
        const userId = req.user._id;

        const { orderId } = req.body;

        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------

        const order = await Order.findOne({
            _id: orderId,
            user: userId,
        });

        if (!order) {
            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // CHECK ONLINE PAYMENT
        // -------------------------------------------------

        if (
            order.paymentMethod !== "online"
        ) {
            return next(
                new ApiError(
                    400,
                    "Online payment is not available for this order"
                )
            );
        }

        // -------------------------------------------------
        // ALREADY PAID
        // -------------------------------------------------

        if (
            order.paymentStatus === "paid"
        ) {
            return next(
                new ApiError(
                    400,
                    "Order has already been paid"
                )
            );
        }

        // -------------------------------------------------
        // INVALID STATUS
        // -------------------------------------------------

        const invalidStatuses = [
            "cancelled",
            "delivered",
            "returned",
            "refunded",
        ];

        if (
            invalidStatuses.includes(
                order.orderStatus
            )
        ) {
            return next(
                new ApiError(
                    400,
                    `Payment cannot be initiated for ${order.orderStatus} order`
                )
            );
        }

        // -------------------------------------------------
        // AMOUNT
        // -------------------------------------------------

        const amount = Number(
            order.totalAmount
        );

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid order amount"
                )
            );
        }

        const amountInPaise =
            Math.round(amount * 100);

        // -------------------------------------------------
        // EXISTING PAYMENT
        // -------------------------------------------------

        const existingPayment =
            await Payment.findOne({
                order: order._id,
                user: userId,
                paymentMethod: "online",
                status: {
                    $in: [
                        "pending",
                        "processing",
                    ],
                },
            }).sort({
                createdAt: -1,
            });

        // -------------------------------------------------
        // REUSE EXISTING RAZORPAY ORDER
        // -------------------------------------------------

        if (
            existingPayment &&
            existingPayment.razorpayOrderId
        ) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        paymentId:
                            existingPayment._id,

                        orderId:
                            order._id,

                        orderNumber:
                            order.orderNumber,

                        razorpayOrderId:
                            existingPayment.razorpayOrderId,

                        amount:
                            Math.round(
                                existingPayment.amount *
                                    100
                            ),

                        currency:
                            existingPayment.currency,

                        keyId:
                            process.env
                                .RAZORPAY_KEY_ID,
                    },
                    "Existing Razorpay order retrieved successfully"
                )
            );
        }

        // -------------------------------------------------
        // CREATE RAZORPAY ORDER
        // -------------------------------------------------

        let razorpayOrder;

        try {
            razorpayOrder =
                await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt:
                        `order_${order.orderNumber}`,
                    notes: {
                        orderId:
                            order._id.toString(),

                        orderNumber:
                            order.orderNumber,

                        userId:
                            userId.toString(),
                    },
                });
        } catch (error) {
            console.error(
                "Razorpay order creation error:",
                error
            );

            return next(
                new ApiError(
                    502,
                    "Unable to create Razorpay order"
                )
            );
        }

        // -------------------------------------------------
        // CREATE PAYMENT
        // -------------------------------------------------

        const payment =
            await Payment.create({
                order: order._id,
                user: userId,
                amount,
                currency: "INR",
                paymentMethod: "online",
                gateway: "razorpay",
                status: "pending",
                razorpayOrderId:
                    razorpayOrder.id,
            });

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    paymentId:
                        payment._id,

                    orderId:
                        order._id,

                    orderNumber:
                        order.orderNumber,

                    razorpayOrderId:
                        razorpayOrder.id,

                    amount:
                        razorpayOrder.amount,

                    currency:
                        razorpayOrder.currency,

                    keyId:
                        process.env
                            .RAZORPAY_KEY_ID,
                },
                "Razorpay order created successfully"
            )
        );
    }
);

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyRazorpayPayment = asyncHandler(
        async (req, res, next) => {
            const userId = req.user._id;

            const {
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            } = req.body;

            // -------------------------------------------------
            // FIND PAYMENT
            // -------------------------------------------------

            const payment =
                await Payment.findOne({
                    razorpayOrderId,
                    user: userId,
                });

            if (!payment) {
                return next(
                    new ApiError(
                        404,
                        "Payment record not found"
                    )
                );
            }

            // -------------------------------------------------
            // ALREADY VERIFIED
            // -------------------------------------------------

            if (
                payment.status ===
                "success"
            ) {
                return res.status(200).json(
                    new ApiResponse(
                        200,
                        {
                            paymentId:
                                payment._id,

                            orderId:
                                payment.order,

                            status:
                                payment.status,
                        },
                        "Payment already verified"
                    )
                );
            }

            // -------------------------------------------------
            // SIGNATURE
            // -------------------------------------------------

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpayOrderId}|${razorpayPaymentId}`
                    )
                    .digest("hex");

            if (
                generatedSignature.length !==
                razorpaySignature.length
            ) {
                payment.status =
                    "failed";

                payment.failureReason =
                    "Invalid Razorpay payment signature";

                await payment.save();

                return next(
                    new ApiError(
                        400,
                        "Payment verification failed"
                    )
                );
            }

            const isValidSignature =
                crypto.timingSafeEqual(
                    Buffer.from(
                        generatedSignature
                    ),
                    Buffer.from(
                        razorpaySignature
                    )
                );

            if (!isValidSignature) {
                payment.status =
                    "failed";

                payment.failureReason =
                    "Invalid Razorpay payment signature";

                await payment.save();

                return next(
                    new ApiError(
                        400,
                        "Payment verification failed"
                    )
                );
            }

            // -------------------------------------------------
            // FIND ORDER
            // -------------------------------------------------

            const order =
                await Order.findOne({
                    _id: payment.order,
                    user: userId,
                });

            if (!order) {
                return next(
                    new ApiError(
                        404,
                        "Associated order not found"
                    )
                );
            }

            // -------------------------------------------------
            // UPDATE PAYMENT
            // -------------------------------------------------

            payment.razorpayPaymentId =
                razorpayPaymentId;

            payment.status =
                "success";

            payment.failureReason = "";

            payment.paidAt =
                new Date();

            await payment.save();

            // -------------------------------------------------
            // UPDATE ORDER
            // -------------------------------------------------

            order.paymentStatus =
                "paid";

            if (
                order.orderStatus ===
                "pending"
            ) {
                order.orderStatus =
                    "confirmed";
            }

            await order.save();

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        paymentId:
                            payment._id,

                        orderId:
                            order._id,

                        orderNumber:
                            order.orderNumber,

                        razorpayOrderId,

                        razorpayPaymentId,

                        paymentStatus:
                            payment.status,

                        orderStatus:
                            order.orderStatus,
                    },
                    "Payment verified successfully"
                )
            );
        }
    );

// =====================================================
// CREATE COD PAYMENT
// =====================================================

const createCODPayment = asyncHandler(
    async (req, res, next) => {
        const userId = req.user._id;

        const { orderId } = req.body;

        // -------------------------------------------------
        // FIND ORDER
        // -------------------------------------------------

        const order = await Order.findOne({
            _id: orderId,
            user: userId,
        });

        if (!order) {
            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // CHECK COD
        // -------------------------------------------------

        if (
            order.paymentMethod !== "cod"
        ) {
            return next(
                new ApiError(
                    400,
                    "COD is not selected for this order"
                )
            );
        }

        // -------------------------------------------------
        // ALREADY PAID
        // -------------------------------------------------

        if (
            order.paymentStatus === "paid"
        ) {
            return next(
                new ApiError(
                    400,
                    "Order is already paid"
                )
            );
        }

        // -------------------------------------------------
        // INVALID STATUS
        // -------------------------------------------------

        const invalidStatuses = [
            "cancelled",
            "delivered",
            "returned",
            "refunded",
        ];

        if (
            invalidStatuses.includes(
                order.orderStatus
            )
        ) {
            return next(
                new ApiError(
                    400,
                    `COD payment cannot be created for ${order.orderStatus} order`
                )
            );
        }

        // -------------------------------------------------
        // EXISTING PAYMENT
        // -------------------------------------------------

        const existingPayment =
            await Payment.findOne({
                order: order._id,
                user: userId,
                paymentMethod: "cod",
            });

        if (existingPayment) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        paymentId:
                            existingPayment._id,

                        orderId:
                            order._id,

                        orderNumber:
                            order.orderNumber,

                        amount:
                            existingPayment.amount,

                        currency:
                            existingPayment.currency,

                        paymentMethod:
                            existingPayment.paymentMethod,

                        gateway:
                            existingPayment.gateway,

                        status:
                            existingPayment.status,
                    },
                    "COD payment already created"
                )
            );
        }

        // -------------------------------------------------
        // CREATE PAYMENT
        // -------------------------------------------------

        const payment =
            await Payment.create({
                order: order._id,
                user: userId,
                amount: order.totalAmount,
                currency: "INR",
                paymentMethod: "cod",
                gateway: "cod",
                status: "pending",
            });

        // -------------------------------------------------
        // UPDATE ORDER
        // -------------------------------------------------

        order.paymentStatus =
            "pending";

        order.orderStatus =
            "confirmed";

        await order.save();

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json(
            new ApiResponse(
                201,
                {
                    paymentId:
                        payment._id,

                    orderId:
                        order._id,

                    orderNumber:
                        order.orderNumber,

                    amount:
                        payment.amount,

                    currency:
                        payment.currency,

                    paymentMethod:
                        payment.paymentMethod,

                    gateway:
                        payment.gateway,

                    paymentStatus:
                        payment.status,

                    orderStatus:
                        order.orderStatus,
                },
                "COD payment created successfully"
            )
        );
    }
);

// =====================================================
// COMPLETE COD PAYMENT
// =====================================================

const completeCODPayment = asyncHandler(
        async (req, res, next) => {
            const { paymentId } =
                req.params;

            // -------------------------------------------------
            // FIND PAYMENT
            // -------------------------------------------------

            const payment =
                await Payment.findById(
                    paymentId
                );

            if (!payment) {
                return next(
                    new ApiError(
                        404,
                        "Payment not found"
                    )
                );
            }

            // -------------------------------------------------
            // CHECK COD
            // -------------------------------------------------

            if (
                payment.paymentMethod !==
                    "cod" ||
                payment.gateway !== "cod"
            ) {
                return next(
                    new ApiError(
                        400,
                        "This is not a COD payment"
                    )
                );
            }

            // -------------------------------------------------
            // ALREADY SUCCESS
            // -------------------------------------------------

            if (
                payment.status ===
                "success"
            ) {
                return next(
                    new ApiError(
                        400,
                        "COD payment is already completed"
                    )
                );
            }

            // -------------------------------------------------
            // FIND ORDER
            // -------------------------------------------------

            const order =
                await Order.findById(
                    payment.order
                );

            if (!order) {
                return next(
                    new ApiError(
                        404,
                        "Associated order not found"
                    )
                );
            }

            // -------------------------------------------------
            // ONLY AFTER DELIVERY
            // -------------------------------------------------

            if (
                order.orderStatus !==
                "delivered"
            ) {
                return next(
                    new ApiError(
                        400,
                        "COD payment can only be completed after order delivery"
                    )
                );
            }

            // -------------------------------------------------
            // UPDATE PAYMENT
            // -------------------------------------------------

            payment.status =
                "success";

            payment.paidAt =
                new Date();

            payment.failureReason = "";

            await payment.save();

            // -------------------------------------------------
            // UPDATE ORDER
            // -------------------------------------------------

            order.paymentStatus =
                "paid";

            await order.save();

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        paymentId:
                            payment._id,

                        orderId:
                            order._id,

                        orderNumber:
                            order.orderNumber,

                        paymentMethod:
                            payment.paymentMethod,

                        paymentStatus:
                            payment.status,

                        orderStatus:
                            order.orderStatus,

                        paidAt:
                            payment.paidAt,
                    },
                    "COD payment completed successfully"
                )
            );
        }
    );

// =====================================================
// GET MY PAYMENTS
// =====================================================

const getMyPayments = asyncHandler(
    async (req, res) => {
        const userId = req.user._id;

        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1
            ),
            50
        );

        const skip =
            (page - 1) * limit;

        const [
            payments,
            total,
        ] = await Promise.all([
            Payment.find({
                user: userId,
            })
                .populate(
                    "order",
                    "orderNumber totalAmount orderStatus paymentStatus createdAt"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            Payment.countDocuments({
                user: userId,
            }),
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    payments,

                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages:
                            Math.ceil(
                                total / limit
                            ),
                    },
                },
                "Payment history retrieved successfully"
            )
        );
    }
);

// =====================================================
// GET PAYMENT BY ID
// =====================================================

const getPaymentById = asyncHandler(
        async (req, res, next) => {
            const userId = req.user._id;

            const { paymentId } =
                req.params;

            const payment =
                await Payment.findOne({
                    _id: paymentId,
                    user: userId,
                })
                    .populate(
                        "order",
                        "orderNumber items subtotal shippingFee discount totalAmount paymentMethod paymentStatus orderStatus shippingAddress createdAt"
                    )
                    .lean();

            if (!payment) {
                return next(
                    new ApiError(
                        404,
                        "Payment not found"
                    )
                );
            }

            return res.status(200).json(
                new ApiResponse(
                    200,
                    payment,
                    "Payment details retrieved successfully"
                )
            );
        }
    );

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createCODPayment,
    completeCODPayment,
    getMyPayments,
    getPaymentById,
};