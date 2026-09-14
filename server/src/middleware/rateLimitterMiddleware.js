const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";

// =====================================================
// COMMON OPTIONS
// =====================================================

const commonOptions = {
    standardHeaders: true,
    legacyHeaders: false,
};

// =====================================================
// HELPER FUNCTION
// =====================================================

const createLimiter = ({
    windowMs = 15 * 60 * 1000,
    max,
    message,
}) => {
    return rateLimit({
        windowMs,

        // Development mein React StrictMode aur testing
        // ke repeated requests se 429 avoid hoga
        max: isProduction ? max : 10000,

        ...commonOptions,

        message: {
            success: false,
            statusCode: 429,
            message,
        },
    });
};

// =====================================================
// GENERAL API RATE LIMITER
// =====================================================

const generalLimiter = createLimiter({
    max: 500,
    message: "Too many requests, please try again later",
});

// =====================================================
// AUTH RATE LIMITERS
// =====================================================

const signupLimiter = createLimiter({
    max: 5,
    message: "Too many signup attempts, please try again later",
});

const loginLimiter = createLimiter({
    max: 5,
    message: "Too many login attempts, please try again later",
});

const otpLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many OTP requests, please try again later",
});

const forgotPasswordLimiter = createLimiter({
    max: 5,
    message: "Too many password reset requests, please try again later",
});

const resetPasswordLimiter = createLimiter({
    max: 5,
    message: "Too many password reset attempts, please try again later",
});

const googleLoginLimiter = createLimiter({
    max: 10,
    message: "Too many Google login attempts, please try again later",
});

// =====================================================
// USER / PROFILE
// =====================================================

const profileLimiter = createLimiter({
    max: 100,
    message: "Too many profile requests, please try again later",
});

// =====================================================
// ADDRESS
// =====================================================

const addressLimiter = createLimiter({
    max: 100,
    message: "Too many address requests, please try again later",
});

// =====================================================
// PRODUCT
// =====================================================

const productLimiter = createLimiter({
    max: 200,
    message: "Too many product requests, please try again later",
});

// =====================================================
// CATEGORY
// =====================================================

const categoryLimiter = createLimiter({
    max: 200,
    message: "Too many category requests, please try again later",
});

// =====================================================
// BRAND
// =====================================================

const brandLimiter = createLimiter({
    max: 200,
    message: "Too many brand requests, please try again later",
});

// =====================================================
// CART
// =====================================================

const cartLimiter = createLimiter({
    max: 150,
    message: "Too many cart requests, please try again later",
});

// =====================================================
// COUPON
// =====================================================

const couponLimiter = createLimiter({
    max: 100,
    message: "Too many coupon requests, please try again later",
});

// =====================================================
// ORDER
// =====================================================

const orderLimiter = createLimiter({
    max: 100,
    message: "Too many order requests, please try again later",
});

// =====================================================
// PAYMENT
// =====================================================

const paymentLimiter = createLimiter({
    max: 50,
    message: "Too many payment requests, please try again later",
});

// =====================================================
// SELLER
// =====================================================

const sellerLimiter = createLimiter({
    max: 150,
    message: "Too many seller requests, please try again later",
});

// =====================================================
// ADMIN
// =====================================================

const adminLimiter = createLimiter({
    max: 500,
    message: "Too many admin requests, please try again later",
});

// =====================================================
// REVIEW
// =====================================================

const reviewLimiter = createLimiter({
    max: 100,
    message: "Too many review requests, please try again later",
});

// =====================================================
// WISHLIST
// =====================================================

const wishlistLimiter = createLimiter({
    max: 150,
    message: "Too many wishlist requests, please try again later",
});

// =====================================================
// SHIPPING
// =====================================================

const shippingLimiter = createLimiter({
    max: 100,
    message: "Too many shipping requests, please try again later",
});

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    generalLimiter,

    signupLimiter,
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    googleLoginLimiter,

    profileLimiter,

    addressLimiter,

    productLimiter,
    categoryLimiter,
    brandLimiter,

    cartLimiter,
    couponLimiter,
    orderLimiter,
    paymentLimiter,

    sellerLimiter,
    adminLimiter,

    reviewLimiter,
    wishlistLimiter,
    shippingLimiter,
};