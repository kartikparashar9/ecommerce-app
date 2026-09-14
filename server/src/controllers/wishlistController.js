const mongoose = require("mongoose");

const Wishlist = require("../models/wishlistModel");
const Product = require("../models/productModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// Authentication Helper
// -----------------------------------------------------

const getUserId = (req) => {
    return req.user?._id;
};

// =====================================================
// GET MY WISHLIST
// =====================================================

const getMyWishlist = async (
    req,
    res,
    next
) => {
    try {
        const userId = getUserId(req);

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Wishlist
        // -------------------------------------------------

        const wishlist =
            await Wishlist.findOne({
                user: userId,
            })
                .populate({
                    path: "items.product",
                    select:
                        "name slug seller category brand variants isActive isFeatured",
                    populate: [
                        {
                            path: "seller",
                            select:
                                "name",
                        },
                        {
                            path: "category",
                            select:
                                "name slug",
                        },
                        {
                            path: "brand",
                            select:
                                "name slug",
                        },
                    ],
                })
                .lean();

        // -------------------------------------------------
        // Wishlist Does Not Exist
        // -------------------------------------------------

        if (!wishlist) {
            return res.status(200).json({
                success: true,

                message:
                    "Wishlist fetched successfully",

                count: 0,

                data: {
                    _id: null,
                    user: userId,
                    items: [],
                },
            });
        }

        // -------------------------------------------------
        // Remove Deleted/Unavailable Products
        // -------------------------------------------------

        const validItems =
            wishlist.items.filter(
                (item) =>
                    item.product
            );

        return res.status(200).json({
            success: true,

            message:
                "Wishlist fetched successfully",

            count: validItems.length,

            data: {
                ...wishlist,
                items: validItems,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// ADD PRODUCT TO WISHLIST
// =====================================================

const addToWishlist = async (
    req,
    res,
    next
) => {
    try {
        const userId = getUserId(req);

        const { productId } =
            req.params;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Validate Product ID
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                productId
            )
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid product ID"
                )
            );
        }

        // -------------------------------------------------
        // Find Product
        // -------------------------------------------------

        const product =
            await Product.findById(
                productId
            )
                .select(
                    "_id name slug isActive"
                )
                .lean();

        if (!product) {
            return next(
                new ApiError(
                    404,
                    "Product not found"
                )
            );
        }

        // -------------------------------------------------
        // Product Active Check
        // -------------------------------------------------

        if (!product.isActive) {
            return next(
                new ApiError(
                    400,
                    "This product is currently unavailable"
                )
            );
        }

        // -------------------------------------------------
        // Find/Create Wishlist
        // -------------------------------------------------

        let wishlist =
            await Wishlist.findOne({
                user: userId,
            });

        if (!wishlist) {
            wishlist =
                new Wishlist({
                    user: userId,
                    items: [
                        {
                            product:
                                product._id,
                            addedAt:
                                new Date(),
                        },
                    ],
                });

            await wishlist.save();

            return res.status(201).json({
                success: true,

                message:
                    "Product added to wishlist",

                data: wishlist,
            });
        }

        // -------------------------------------------------
        // Check Duplicate
        // -------------------------------------------------

        const alreadyExists =
            wishlist.items.some(
                (item) =>
                    item.product.toString() ===
                    productId
            );

        if (alreadyExists) {
            return next(
                new ApiError(
                    409,
                    "Product is already in your wishlist"
                )
            );
        }

        // -------------------------------------------------
        // Add Product
        // -------------------------------------------------

        wishlist.items.push({
            product:
                product._id,

            addedAt:
                new Date(),
        });

        await wishlist.save();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Product added to wishlist",

            data: wishlist,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// REMOVE PRODUCT FROM WISHLIST
// =====================================================

const removeFromWishlist = async (
    req,
    res,
    next
) => {
    try {
        const userId = getUserId(req);

        const { productId } =
            req.params;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Validate Product ID
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                productId
            )
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid product ID"
                )
            );
        }

        // -------------------------------------------------
        // Find Wishlist
        // -------------------------------------------------

        const wishlist =
            await Wishlist.findOne({
                user: userId,
            });

        if (!wishlist) {
            return next(
                new ApiError(
                    404,
                    "Wishlist not found"
                )
            );
        }

        // -------------------------------------------------
        // Find Product
        // -------------------------------------------------

        const itemIndex =
            wishlist.items.findIndex(
                (item) =>
                    item.product.toString() ===
                    productId
            );

        if (itemIndex === -1) {
            return next(
                new ApiError(
                    404,
                    "Product is not in your wishlist"
                )
            );
        }

        // -------------------------------------------------
        // Remove Item
        // -------------------------------------------------

        wishlist.items.splice(
            itemIndex,
            1
        );

        await wishlist.save();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Product removed from wishlist",

            data: wishlist,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// CHECK PRODUCT IN WISHLIST
// =====================================================

const checkWishlist = async (
    req,
    res,
    next
) => {
    try {
        const userId = getUserId(req);

        const { productId } =
            req.params;

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Validate Product ID
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                productId
            )
        ) {
            return next(
                new ApiError(
                    400,
                    "Invalid product ID"
                )
            );
        }

        // -------------------------------------------------
        // Find Wishlist
        // -------------------------------------------------

        const wishlist =
            await Wishlist.findOne({
                user: userId,
            })
                .select("items")
                .lean();

        // -------------------------------------------------
        // Not Found
        // -------------------------------------------------

        if (!wishlist) {
            return res.status(200).json({
                success: true,

                message:
                    "Wishlist status fetched successfully",

                data: {
                    productId,
                    isInWishlist: false,
                },
            });
        }

        // -------------------------------------------------
        // Check Product
        // -------------------------------------------------

        const isInWishlist =
            wishlist.items.some(
                (item) =>
                    item.product.toString() ===
                    productId
            );

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Wishlist status fetched successfully",

            data: {
                productId,
                isInWishlist,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// CLEAR WISHLIST
// =====================================================

const clearWishlist = async (
    req,
    res,
    next
) => {
    try {
        const userId = getUserId(req);

        // -------------------------------------------------
        // Authentication
        // -------------------------------------------------

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Find Wishlist
        // -------------------------------------------------

        const wishlist =
            await Wishlist.findOne({
                user: userId,
            });

        if (!wishlist) {
            return res.status(200).json({
                success: true,

                message:
                    "Wishlist is already empty",

                data: {
                    items: [],
                },
            });
        }

        // -------------------------------------------------
        // Clear Items
        // -------------------------------------------------

        wishlist.items = [];

        await wishlist.save();

        // -------------------------------------------------
        // Response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Wishlist cleared successfully",

            data: wishlist,
        });
    } catch (error) {
        return next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getMyWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    clearWishlist,
};