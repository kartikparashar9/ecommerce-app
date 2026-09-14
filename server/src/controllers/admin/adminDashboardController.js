const User = require("../../models/userModel");
const Seller = require("../../models/sellerModel");
const Product = require("../../models/productModel");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../utils/asyncHandler");


// =====================================================
// GET ADMIN DASHBOARD
// =====================================================
// GET /api/admin/dashboard
// =====================================================

const getAdminDashboard = asyncHandler(async (req, res) => {

    // =================================================
    // STATISTICS
    // =================================================

    const [
        totalUsers,
        blockedUsers,

        totalSellers,
        pendingSellers,
        approvedSellers,
        rejectedSellers,
        activeSellers,
        blockedSellers,

        totalProducts,
        activeProducts,
        inactiveProducts,
        featuredProducts,
    ] = await Promise.all([

        // =============================================
        // USERS
        // =============================================

        User.countDocuments({
            role: "user",
        }),

        User.countDocuments({
            role: "user",
            isBlocked: true,
        }),


        // =============================================
        // SELLERS
        // =============================================

        Seller.countDocuments({
            isDeleted: false,
        }),

        Seller.countDocuments({
            verificationStatus: "pending",
            isDeleted: false,
        }),

        Seller.countDocuments({
            verificationStatus: "approved",
            isDeleted: false,
        }),

        Seller.countDocuments({
            verificationStatus: "rejected",
            isDeleted: false,
        }),

        Seller.countDocuments({
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        }),

        Seller.countDocuments({
            isBlocked: true,
            isDeleted: false,
        }),


        // =============================================
        // PRODUCTS
        // =============================================

        Product.countDocuments(),

        Product.countDocuments({
            isActive: true,
        }),

        Product.countDocuments({
            isActive: false,
        }),

        Product.countDocuments({
            isFeatured: true,
        }),
    ]);


    // =================================================
    // RECENT USERS
    // =================================================

    const recentUsers = await User.find({
        role: "user",
    })
        .select(
            "name email avatar isBlocked createdAt"
        )
        .sort({
            createdAt: -1,
        })
        .limit(5)
        .lean();


    // =================================================
    // RECENT SELLERS
    // =================================================

    const recentSellers = await Seller.find({
        isDeleted: false,
    })
        .populate(
            "user",
            "name email avatar"
        )
        .select(
            `
            businessName
            verificationStatus
            isActive
            isBlocked
            createdAt
            user
            `
        )
        .sort({
            createdAt: -1,
        })
        .limit(5)
        .lean();


    // =================================================
    // RECENT PRODUCTS
    // =================================================

    const recentProducts = await Product.find()
        .populate(
            "seller",
            "name email"
        )
        .populate(
            "category",
            "name"
        )
        .select(
            `
            name
            slug
            images
            finalPrice
            totalStock
            isActive
            isFeatured
            createdAt
            seller
            category
            `
        )
        .sort({
            createdAt: -1,
        })
        .limit(5)
        .lean();


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                statistics: {

                    users: {
                        total: totalUsers,
                        blocked: blockedUsers,
                    },

                    sellers: {
                        total: totalSellers,
                        pending: pendingSellers,
                        approved: approvedSellers,
                        rejected: rejectedSellers,
                        active: activeSellers,
                        blocked: blockedSellers,
                    },

                    products: {
                        total: totalProducts,
                        active: activeProducts,
                        inactive: inactiveProducts,
                        featured: featuredProducts,
                    },
                },

                recentActivity: {

                    users: recentUsers,

                    sellers: recentSellers,

                    products: recentProducts,
                },
            },

            "Admin dashboard fetched successfully"
        )
    );
});


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAdminDashboard,
};