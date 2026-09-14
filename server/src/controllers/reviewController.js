const mongoose = require("mongoose");

const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// GET PRODUCT REVIEWS
// =====================================================

const getProductReviews = async (
    req,
    res,
    next
) => {
    try {
        const {
            productId,
        } = req.params;

        const {
            page = 1,
            limit = 10,
            rating,
        } = req.query;

        if (
            !isValidObjectId(
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

        const product =
            await Product.findById(
                productId
            )
                .select("_id")
                .lean();

        if (!product) {
            return next(
                new ApiError(
                    404,
                    "Product not found"
                )
            );
        }

        const currentPage =
            Math.max(
                Number(page) || 1,
                1
            );

        const perPage =
            Math.min(
                Math.max(
                    Number(limit) || 10,
                    1
                ),
                50
            );

        const filter = {
            product: productId,
            status: "approved",
        };

        if (
            rating !== undefined
        ) {
            const numericRating =
                Number(rating);

            if (
                !Number.isInteger(
                    numericRating
                ) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return next(
                    new ApiError(
                        400,
                        "Invalid rating filter"
                    )
                );
            }

            filter.rating =
                numericRating;
        }

        const skip =
            (currentPage - 1) *
            perPage;

        const [
            reviews,
            totalReviews,
            summary,
        ] = await Promise.all([
            Review.find(filter)
                .populate({
                    path: "user",
                    select:
                        "name avatar",
                })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage)
                .lean(),

            Review.countDocuments(
                filter
            ),

            Review.aggregate([
                {
                    $match: {
                        product:
                            new mongoose.Types.ObjectId(
                                productId
                            ),
                        status: "approved",
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageRating: {
                            $avg: "$rating",
                        },
                        total: {
                            $sum: 1,
                        },
                        fiveStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$rating",
                                            5,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        fourStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$rating",
                                            4,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        threeStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$rating",
                                            3,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        twoStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$rating",
                                            2,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        oneStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$rating",
                                            1,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        const ratingSummary =
            summary[0] || {
                averageRating: 0,
                total: 0,
                fiveStar: 0,
                fourStar: 0,
                threeStar: 0,
                twoStar: 0,
                oneStar: 0,
            };

        ratingSummary.averageRating =
            Number(
                (
                    ratingSummary.averageRating ||
                    0
                ).toFixed(2)
            );

        return res.status(200).json({
            success: true,
            message:
                "Product reviews fetched successfully",

            data: reviews,

            pagination: {
                page: currentPage,
                limit: perPage,
                total: totalReviews,
                totalPages:
                    Math.ceil(
                        totalReviews /
                            perPage
                    ),
            },

            ratingSummary,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// CREATE REVIEW
// =====================================================

const createReview = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        const {
            productId,
            orderId,
            variantId = null,
            rating,
            title = "",
            comment,
        } = req.body;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        // -------------------------------------------------
        // Product
        // -------------------------------------------------

        const product =
            await Product.findById(
                productId
            ).lean();

        if (!product) {
            return next(
                new ApiError(
                    404,
                    "Product not found"
                )
            );
        }

        // -------------------------------------------------
        // Order
        // -------------------------------------------------

        const order =
            await Order.findOne({
                _id: orderId,
                user: userId,
            }).lean();

        if (!order) {
            return next(
                new ApiError(
                    404,
                    "Order not found"
                )
            );
        }

        // -------------------------------------------------
        // Must be Delivered
        // -------------------------------------------------

        if (
            order.orderStatus !==
            "delivered"
        ) {
            return next(
                new ApiError(
                    400,
                    "You can review a product only after the order is delivered"
                )
            );
        }

        // -------------------------------------------------
        // Check Product Exists In Order
        // -------------------------------------------------

        const purchasedItem =
            order.items.find(
                (item) =>
                    item.product &&
                    item.product.toString() ===
                        productId.toString()
            );

        if (!purchasedItem) {
            return next(
                new ApiError(
                    403,
                    "You can review only products purchased in this order"
                )
            );
        }

        // -------------------------------------------------
        // Variant Validation
        // -------------------------------------------------

        if (variantId) {
            if (
                !purchasedItem.variant ||
                purchasedItem.variant.toString() !==
                    variantId.toString()
            ) {
                return next(
                    new ApiError(
                        403,
                        "Selected variant does not belong to this purchased item"
                    )
                );
            }
        }

        // -------------------------------------------------
        // Existing Review
        // -------------------------------------------------

        const existingReview =
            await Review.findOne({
                user: userId,
                product: productId,
            }).lean();

        if (existingReview) {
            return next(
                new ApiError(
                    409,
                    "You have already reviewed this product"
                )
            );
        }

        // -------------------------------------------------
        // Create
        // -------------------------------------------------

        const review =
            await Review.create({
                user: userId,
                product: productId,
                order: orderId,
                variant: variantId,
                rating: Number(rating),
                title:
                    typeof title === "string"
                        ? title.trim()
                        : "",
                comment:
                    comment.trim(),
                status: "approved",
                isVerifiedPurchase:
                    true,
            });

        const createdReview =
            await Review.findById(
                review._id
            )
                .populate({
                    path: "user",
                    select:
                        "name avatar",
                })
                .populate({
                    path: "product",
                    select:
                        "name slug",
                })
                .lean();

        return res.status(201).json({
            success: true,
            message:
                "Review created successfully",
            data: createdReview,
        });
    } catch (error) {
        // -------------------------------------------------
        // Duplicate Key Protection
        // -------------------------------------------------

        if (
            error?.code === 11000
        ) {
            return next(
                new ApiError(
                    409,
                    "You have already reviewed this product"
                )
            );
        }

        next(error);
    }
};

// =====================================================
// GET MY REVIEWS
// =====================================================

const getMyReviews = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const reviews =
            await Review.find({
                user: userId,
            })
                .populate({
                    path: "product",
                    select:
                        "name slug",
                })
                .populate({
                    path: "order",
                    select:
                        "orderNumber orderStatus createdAt",
                })
                .sort({
                    createdAt: -1,
                })
                .lean();

        return res.status(200).json({
            success: true,
            message:
                "Your reviews fetched successfully",
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// UPDATE MY REVIEW
// =====================================================

const updateReview = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        const {
            reviewId,
        } = req.params;

        const {
            rating,
            title,
            comment,
        } = req.body;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const review =
            await Review.findOne({
                _id: reviewId,
                user: userId,
            });

        if (!review) {
            return next(
                new ApiError(
                    404,
                    "Review not found"
                )
            );
        }

        if (
            rating !== undefined
        ) {
            review.rating =
                Number(rating);
        }

        if (
            title !== undefined
        ) {
            review.title =
                title.trim();
        }

        if (
            comment !== undefined
        ) {
            review.comment =
                comment.trim();
        }

        // -------------------------------------------------
        // Re-moderate Updated Review
        // -------------------------------------------------

        review.status =
            "pending";

        review.rejectionReason =
            "";

        review.moderatedBy =
            null;

        review.moderatedAt =
            null;

        await review.save();

        const updatedReview =
            await Review.findById(
                review._id
            )
                .populate({
                    path: "user",
                    select:
                        "name avatar",
                })
                .populate({
                    path: "product",
                    select:
                        "name slug",
                })
                .lean();

        return res.status(200).json({
            success: true,
            message:
                "Review updated successfully and sent for moderation",
            data: updatedReview,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// DELETE MY REVIEW
// =====================================================

const deleteReview = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            req.user?._id;

        const {
            reviewId,
        } = req.params;

        if (!userId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const review =
            await Review.findOneAndDelete({
                _id: reviewId,
                user: userId,
            });

        if (!review) {
            return next(
                new ApiError(
                    404,
                    "Review not found"
                )
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Review deleted successfully",
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADMIN GET REVIEWS
// =====================================================

const getAllReviewsAdmin = async (
    req,
    res,
    next
) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            productId,
            rating,
        } = req.query;

        const currentPage =
            Math.max(
                Number(page) || 1,
                1
            );

        const perPage =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                100
            );

        const filter = {};

        if (status) {
            const allowedStatuses = [
                "pending",
                "approved",
                "rejected",
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return next(
                    new ApiError(
                        400,
                        "Invalid review status"
                    )
                );
            }

            filter.status =
                status;
        }

        if (productId) {
            if (
                !isValidObjectId(
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

            filter.product =
                productId;
        }

        if (rating) {
            const numericRating =
                Number(rating);

            if (
                !Number.isInteger(
                    numericRating
                ) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return next(
                    new ApiError(
                        400,
                        "Invalid rating"
                    )
                );
            }

            filter.rating =
                numericRating;
        }

        const skip =
            (currentPage - 1) *
            perPage;

        const [
            reviews,
            total,
        ] = await Promise.all([
            Review.find(filter)
                .populate({
                    path: "user",
                    select:
                        "name email avatar",
                })
                .populate({
                    path: "product",
                    select:
                        "name slug",
                })
                .populate({
                    path: "order",
                    select:
                        "orderNumber orderStatus",
                })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(perPage)
                .lean(),

            Review.countDocuments(
                filter
            ),
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Reviews fetched successfully",

            count: reviews.length,

            data: reviews,

            pagination: {
                page: currentPage,
                limit: perPage,
                total,
                totalPages:
                    Math.ceil(
                        total / perPage
                    ),
            },
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADMIN MODERATE REVIEW
// =====================================================

const moderateReview = async (
    req,
    res,
    next
) => {
    try {
        const adminId =
            req.user?._id;

        const {
            reviewId,
        } = req.params;

        const {
            status,
            rejectionReason = "",
        } = req.body;

        if (!adminId) {
            return next(
                new ApiError(
                    401,
                    "Authentication required"
                )
            );
        }

        const review =
            await Review.findById(
                reviewId
            );

        if (!review) {
            return next(
                new ApiError(
                    404,
                    "Review not found"
                )
            );
        }

        review.status =
            status;

        review.moderatedBy =
            adminId;

        review.moderatedAt =
            new Date();

        review.rejectionReason =
            status === "rejected"
                ? rejectionReason.trim()
                : "";

        await review.save();

        const updatedReview =
            await Review.findById(
                review._id
            )
                .populate({
                    path: "user",
                    select:
                        "name email avatar",
                })
                .populate({
                    path: "product",
                    select:
                        "name slug",
                })
                .lean();

        return res.status(200).json({
            success: true,
            message:
                `Review ${status} successfully`,
            data: updatedReview,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADMIN DELETE REVIEW
// =====================================================

const deleteReviewAdmin = async (
    req,
    res,
    next
) => {
    try {
        const {
            reviewId,
        } = req.params;

        const review =
            await Review.findByIdAndDelete(
                reviewId
            );

        if (!review) {
            return next(
                new ApiError(
                    404,
                    "Review not found"
                )
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Review deleted successfully",
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getProductReviews,
    createReview,
    getMyReviews,
    updateReview,
    deleteReview,
    getAllReviewsAdmin,
    moderateReview,
    deleteReviewAdmin,
};