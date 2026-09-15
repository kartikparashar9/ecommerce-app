const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

// =====================================================
// CONFIG
// =====================================================

const morganConfig = require("./config/morganConfig");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentWebhookRoutes = require("./routes/paymentWebhookRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");

// =====================================================
// MIDDLEWARE
// =====================================================

const errorMiddleware = require("./middleware/errorMiddleware");

const {
    generalLimiter,
} = require("./middleware/rateLimitterMiddleware");

// =====================================================
// APP
// =====================================================

const app = express();
app.set("trust proxy", 1);

// =====================================================
// RAZORPAY WEBHOOK
// RAW BODY MUST COME BEFORE express.json()
// =====================================================

app.use(
    "/api/payment",
    paymentWebhookRoutes
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json());z

app.use(
    express.urlencoded({
        extended: true,
    })
);

// =====================================================
// COOKIE PARSER
// =====================================================

app.use(cookieParser());

// =====================================================
// LOGGING
// =====================================================

app.use(morganConfig);

// =====================================================
// SECURITY
// =====================================================

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    })
);

// =====================================================
// CORS
// =====================================================

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// =====================================================
// GENERAL RATE LIMITER
// =====================================================

app.use(generalLimiter);

// =====================================================
// STATIC FILES
// =====================================================

// =====================================================
// AVATARS
// =====================================================

const avatarPath = path.join(
    __dirname,
    "../public/avatars"
);

app.use(
    "/avatars",
    express.static(avatarPath)
);

// =====================================================
// BRAND LOGOS
// =====================================================

const brandPath = path.join(
    __dirname,
    "../public/brands"
);

app.use(
    "/brands",
    express.static(brandPath)
);

// =====================================================
// ROOT API CHECK
// =====================================================

app.get(
    "/",
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "E-Commerce API is running",
        });
    }
);

// =====================================================
// HEALTH CHECK API
// GET /api/health
// =====================================================

app.get(
    "/api/health",
    (req, res) => {
        return res.status(200).json({
            success: true,
            status: "UP",
            message: "E-Commerce API is healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    }
);

// =====================================================
// API ROUTES
// =====================================================

// AUTH
app.use(
    "/api/auth",
    authRoutes
);

// USER
app.use(
    "/api/user",
    userRoutes
);

// CATEGORY
app.use(
    "/api/categories",
    categoryRoutes
);

// BRAND
app.use(
    "/api/brands",
    brandRoutes
);

// PRODUCT
app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/products",
    productImageRoutes
);

// SELLER
app.use(
    "/api/seller",
    sellerRoutes
);

// =====================================================
// ADMIN
// =====================================================

app.use(
    "/api/admin",
    adminUserRoutes
);

app.use(
    "/api/admin",
    adminProductRoutes
);

app.use(
    "/api/admin",
    adminDashboardRoutes
);

// =====================================================
// CART
// =====================================================

app.use(
    "/api/cart",
    cartRoutes
);

// =====================================================
// ADDRESS
// =====================================================

app.use(
    "/api/address",
    addressRoutes
);

// =====================================================
// ORDER
// =====================================================

app.use(
    "/api/orders",
    orderRoutes
);

// =====================================================
// SELLER ORDER
// =====================================================

app.use(
    "/api/seller/orders",
    sellerOrderRoutes
);

// =====================================================
// ADMIN ORDER
// =====================================================

app.use(
    "/api/admin/orders",
    adminOrderRoutes
);

// =====================================================
// PAYMENT
// =====================================================

app.use(
    "/api/payment",
    paymentRoutes
);

// =====================================================
// SHIPPING
// =====================================================

app.use(
    "/api/shipping",
    shippingRoutes
);

// =====================================================
// WISHLIST
// =====================================================

app.use(
    "/api/wishlist",
    wishlistRoutes
);

// =====================================================
// REVIEWS
// =====================================================

app.use(
    "/api/reviews",
    reviewRoutes
);

// =====================================================
// COUPONS
// =====================================================

app.use(
    "/api/coupons",
    couponRoutes
);

// =====================================================
// NOTIFICATIONS
// =====================================================

app.use(
    "/api/notifications",
    notificationRoutes
);

// =====================================================
// ADMIN ANALYTICS
// =====================================================

app.use(
    "/api/admin/analytics",
    adminAnalyticsRoutes
);

// =====================================================
// ERROR HANDLER
// MUST BE LAST
// =====================================================

app.use(errorMiddleware);

// =====================================================
// EXPORT
// =====================================================

module.exports = app;