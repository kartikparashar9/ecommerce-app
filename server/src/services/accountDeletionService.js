const mongoose = require("mongoose");

const User = require("../models/userModel");
const Seller = require("../models/sellerModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const Review = require("../models/reviewModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const Shipping = require("../models/shippingModel");
const Notification = require("../models/notificationModel");
const Coupon = require("../models/couponModel");
const Brand = require("../models/brandModel");
const Category = require("../models/categoryModel");
const PendingUser = require("../models/pendingUserModel");
const OTP = require("../models/OTPModel");

/*
 * Centralized hard-delete service.
 *
 * Important:
 * - User deletion removes all documents that directly belong to the user.
 * - If the user owns a Seller profile, seller-owned products/business data
 *   are removed as part of the same operation.
 * - Seller self-delete currently applies to seller applications only, but
 *   the cleanup is centralized so no seller-owned product/review/cart/
 *   wishlist references can be left behind.
 */
const deleteSellerData = async (sellerId, session = null) => {
    if (!sellerId) return;

    const seller = await Seller.findById(sellerId).session(session);
    if (!seller) return;

    const products = await Product.find(
        { seller: seller._id },
        { _id: 1 }
    ).session(session);

    const productIds = products.map((product) => product._id);

    if (productIds.length > 0) {
        // Remove reviews belonging to products that are being deleted.
        await Review.deleteMany(
            { product: { $in: productIds } },
            { session }
        );

        // Remove deleted products from every user's cart/wishlist.
        await Cart.updateMany(
            { "items.product": { $in: productIds } },
            { $pull: { items: { product: { $in: productIds } } } },
            { session }
        );

        await Wishlist.updateMany(
            { "items.product": { $in: productIds } },
            { $pull: { items: { product: { $in: productIds } } } },
            { session }
        );

        await Product.deleteMany(
            { _id: { $in: productIds } },
            { session }
        );
    }

    // Seller's business document itself.
    await Seller.deleteOne(
        { _id: seller._id },
        { session }
    );
};

const deleteUserData = async (userId, session = null) => {
    if (!userId) return;

    const user = await User.findById(userId)
        .select("+password")
        .session(session);

    if (!user) return;

    // First remove seller-owned business data, if this user has a seller profile.
    const seller = await Seller.findOne({
        user: user._id,
    }).session(session);

    if (seller) {
        await deleteSellerData(seller._id, session);
    }

    // Orders belong to the user. Capture IDs before deleting them because
    // Payment, Shipping and Review documents reference Order.
    const orders = await Order.find(
        { user: user._id },
        { _id: 1 }
    ).session(session);

    const orderIds = orders.map((order) => order._id);

    if (orderIds.length > 0) {
        await Payment.deleteMany(
            {
                $or: [
                    { user: user._id },
                    { order: { $in: orderIds } },
                ],
            },
            { session }
        );

        await Shipping.deleteMany(
            {
                $or: [
                    { user: user._id },
                    { order: { $in: orderIds } },
                ],
            },
            { session }
        );

        await Review.deleteMany(
            {
                $or: [
                    { user: user._id },
                    { order: { $in: orderIds } },
                ],
            },
            { session }
        );

        await Order.deleteMany(
            { _id: { $in: orderIds } },
            { session }
        );
    } else {
        await Payment.deleteMany(
            { user: user._id },
            { session }
        );

        await Shipping.deleteMany(
            { user: user._id },
            { session }
        );

        await Review.deleteMany(
            { user: user._id },
            { session }
        );
    }

    // Direct user-owned data.
    await Promise.all([
        Cart.deleteMany(
            { user: user._id },
            { session }
        ),
        Wishlist.deleteMany(
            { user: user._id },
            { session }
        ),
        Address.deleteMany(
            { user: user._id },
            { session }
        ),
        Notification.deleteMany(
            { recipient: user._id },
            { session }
        ),
    ]);

    // These models use createdBy rather than user ownership.
    // Non-admin account deletion may therefore clean resources created
    // by that account. Admin accounts are protected by the existing
    // admin delete rules.
    await Promise.all([
        Coupon.deleteMany(
            { createdBy: user._id },
            { session }
        ),
        Brand.deleteMany(
            { createdBy: user._id },
            { session }
        ),
        Category.deleteMany(
            { createdBy: user._id },
            { session }
        ),
    ]);

    // Remove pending signup/OTP records identified by this user's
    // current email/phone as well.
    await PendingUser.deleteMany(
        {
            $or: [
                { email: user.email },
                { phone: user.phone },
            ],
        },
        { session }
    );

    await OTP.deleteMany(
        {
            identifier: {
                $in: [user.email, user.phone].filter(Boolean),
            },
        },
        { session }
    );

    // Finally delete the User document.
    await User.deleteOne(
        { _id: user._id },
        { session }
    );
};

const runDeleteOperation = async (operation) => {
    const session = await mongoose.startSession();

    try {
        try {
            await session.withTransaction(async () => {
                await operation(session);
            });
        } catch (error) {
            /*
             * Local MongoDB installations are often standalone servers and
             * do not support transactions. In that case, run the exact same
             * cleanup without a transaction so the existing local setup
             * continues to work. Other errors are not swallowed.
             */
            const message = String(error?.message || "").toLowerCase();
            const transactionUnsupported =
                error?.code === 20 ||
                message.includes("transaction numbers are only allowed") ||
                message.includes("replica set") ||
                message.includes("transactions are not supported");

            if (!transactionUnsupported) {
                throw error;
            }

            await operation(null);
        }
    } finally {
        await session.endSession();
    }
};

const deleteUserCascade = async (userId) => {
    return runDeleteOperation((session) =>
        deleteUserData(userId, session)
    );
};

const deleteSellerCascade = async (sellerId) => {
    return runDeleteOperation((session) =>
        deleteSellerData(sellerId, session)
    );
};

module.exports = {
    deleteUserCascade,
    deleteSellerCascade,
};
