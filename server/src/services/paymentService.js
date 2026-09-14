const crypto = require("crypto");

const razorpay = require("../config/razorpay");

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

const createRazorpayOrder = async ({
    amount,
    currency = "INR",
    receipt,
}) => {
    try {
        // Razorpay amount smallest currency unit mein leta hai
        // INR: ₹1 = 100 paise

        const amountInPaise = Math.round(
            Number(amount) * 100
        );

        if (
            !Number.isFinite(amountInPaise) ||
            amountInPaise <= 0
        ) {
            throw new Error(
                "Invalid payment amount"
            );
        }

        const razorpayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,

                currency,

                receipt,

                payment_capture: 1,
            });

        return razorpayOrder;
    } catch (error) {
        throw error;
    }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT SIGNATURE
// =====================================================

const verifyRazorpayPaymentSignature = ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
}) => {
    if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
    ) {
        return false;
    }

    const body =
        `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

    return (
        expectedSignature ===
        razorpaySignature
    );
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPaymentSignature,
};