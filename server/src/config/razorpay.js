const Razorpay = require("razorpay");

// =====================================================
// RAZORPAY CONFIGURATION
// =====================================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// EXPORT
// =====================================================

module.exports = razorpay;