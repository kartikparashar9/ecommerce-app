const express = require("express");

const router = express.Router();

const {
    razorpayWebhook,
} = require(
    "../controllers/payment/paymentWebhookController"
);

// =====================================================
// RAZORPAY WEBHOOK
// =====================================================

// POST /api/payment/webhook

router.post(
    "/webhook",
    express.raw({
        type: "application/json",
    }),
    razorpayWebhook
);

module.exports = router;