const crypto = require("crypto");

const Payment = require("../../models/paymentModel");
const Order = require("../../models/orderModel");
const { recordCouponUsage } = require("../../services/couponUsageService");

// =====================================================
// VERIFY WEBHOOK SIGNATURE
// =====================================================

const verifyWebhookSignature = (
    rawBody,
    signature
) => {
    if (!rawBody || !signature) {
        return false;
    }

    const secret =
        process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        return false;
    }

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                secret
            )
            .update(rawBody)
            .digest("hex");

    if (
        expectedSignature.length !==
        signature.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(
            expectedSignature
        ),
        Buffer.from(signature)
    );
};

// =====================================================
// RAZORPAY WEBHOOK
// =====================================================

const razorpayWebhook = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // SIGNATURE
        // -------------------------------------------------

        const signature =
            req.headers[
                "x-razorpay-signature"
            ];

        if (!signature) {
            return res.status(400).json({
                success: false,
                message:
                    "Razorpay webhook signature is missing",
            });
        }

        // -------------------------------------------------
        // RAW BODY
        // -------------------------------------------------

        const rawBody = req.body;

        if (!Buffer.isBuffer(rawBody)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid webhook body",
            });
        }

        // -------------------------------------------------
        // VERIFY
        // -------------------------------------------------

        const isValid =
            verifyWebhookSignature(
                rawBody,
                signature
            );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Razorpay webhook signature",
            });
        }

        // -------------------------------------------------
        // PARSE
        // -------------------------------------------------

        let payload;

        try {
            payload = JSON.parse(
                rawBody.toString("utf8")
            );
        } catch (error) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid webhook payload",
            });
        }

        const event = payload.event;

        const paymentEntity =
            payload?.payload?.payment?.entity;

        const refundEntity =
            payload?.payload?.refund?.entity;

        // =================================================
        // PAYMENT CAPTURED
        // =================================================

        if (
            event === "payment.captured"
        ) {
            if (!paymentEntity) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment entity missing",
                });
            }

            const razorpayOrderId =
                paymentEntity.order_id;

            const razorpayPaymentId =
                paymentEntity.id;

            const payment =
                await Payment.findOne({
                    razorpayOrderId,
                });

            if (!payment) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment record not found",
                });
            }

            // Idempotency
            if (
                payment.status ===
                "success"
            ) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment already processed",
                });
            }

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

            const order =
                await Order.findById(
                    payment.order
                );

            if (order) {
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
                await recordCouponUsage(order);
            }

            return res.status(200).json({
                success: true,
                message:
                    "Payment captured successfully",
            });
        }

        // =================================================
        // PAYMENT FAILED
        // =================================================

        if (
            event === "payment.failed"
        ) {
            if (!paymentEntity) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment entity missing",
                });
            }

            const payment =
                await Payment.findOne({
                    razorpayOrderId:
                        paymentEntity.order_id,
                });

            if (!payment) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment record not found",
                });
            }

            if (
                payment.status ===
                "success"
            ) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment already successful",
                });
            }

            if (
                paymentEntity.id &&
                !payment.razorpayPaymentId
            ) {
                payment.razorpayPaymentId =
                    paymentEntity.id;
            }

            payment.status =
                "failed";

            payment.failureReason =
                paymentEntity
                    ?.error_description ||
                paymentEntity
                    ?.error_reason ||
                "Payment failed";

            await payment.save();

            // -------------------------------------------------
            // UPDATE ORDER
            // -------------------------------------------------

            const order =
                await Order.findById(
                    payment.order
                );

            if (order) {
                order.paymentStatus =
                    "failed";

                await order.save();
            }

            return res.status(200).json({
                success: true,
                message:
                    "Payment failure processed",
            });
        }

        // =================================================
        // REFUND PROCESSED
        // =================================================

        if (
            event === "refund.processed"
        ) {
            if (!refundEntity) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Refund entity missing",
                });
            }

            const razorpayPaymentId =
                refundEntity.payment_id;

            const razorpayRefundId =
                refundEntity.id;

            const payment =
                await Payment.findOne({
                    razorpayPaymentId,
                });

            if (!payment) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment record not found",
                });
            }

            // Idempotency
            if (
                payment.razorpayRefundId ===
                razorpayRefundId
            ) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Refund already processed",
                });
            }

            const refundAmount =
                Number(
                    refundEntity.amount
                ) / 100;

            if (
                !Number.isFinite(
                    refundAmount
                ) ||
                refundAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid refund amount",
                });
            }

            const previousRefund =
                Number(
                    payment.refundAmount || 0
                );

            payment.refundAmount =
                Math.min(
                    previousRefund +
                        refundAmount,
                    payment.amount
                );

            payment.razorpayRefundId =
                razorpayRefundId;

            payment.refundedAt =
                new Date();

            if (
                payment.refundAmount >=
                payment.amount
            ) {
                payment.status =
                    "refunded";
            } else {
                payment.status =
                    "partially_refunded";
            }

            await payment.save();

            // -------------------------------------------------
            // UPDATE ORDER
            // -------------------------------------------------

            const order =
                await Order.findById(
                    payment.order
                );

            if (order) {
                if (
                    payment.status ===
                    "refunded"
                ) {
                    order.paymentStatus =
                        "refunded";

                    order.orderStatus =
                        "refunded";
                } else {
                    order.paymentStatus =
                        "partially_refunded";
                }

                await order.save();
            }

            return res.status(200).json({
                success: true,
                message:
                    "Refund processed successfully",
            });
        }

        // =================================================
        // OTHER EVENTS
        // =================================================

        return res.status(200).json({
            success: true,
            message:
                "Webhook received",
        });
    } catch (error) {
        console.error(
            "Razorpay webhook error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Webhook processing failed",
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    razorpayWebhook,
};