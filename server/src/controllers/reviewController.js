const mongoose = require("mongoose");

const Review = require("../models/reviewModel");
const Product = require("../models/productModel");

const ApiError = require("../utils/ApiError");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// GET ALL REVIEWS
// GET /api/reviews
// AUTHENTICATED USER
// =====================================================

const getReviews = async (req, res, next) => {
  try {
    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Query
    // -------------------------------------------------

    const { page = 1, limit = 10, rating, productId } = req.query;

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const skip = (currentPage - 1) * perPage;

    // -------------------------------------------------
    // Filter
    // -------------------------------------------------

    const filter = {
      status: "approved",
    };

    // -------------------------------------------------
    // Product Filter
    // -------------------------------------------------

    if (productId !== undefined) {
      if (!isValidObjectId(productId)) {
        return next(new ApiError(400, "Invalid product ID"));
      }

      filter.product = productId;
    }

    // -------------------------------------------------
    // Rating Filter
    // -------------------------------------------------

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return next(new ApiError(400, "Invalid rating filter"));
      }

      filter.rating = numericRating;
    }

    // -------------------------------------------------
    // Fetch Reviews
    // -------------------------------------------------

    const [reviews, totalReviews, summary] = await Promise.all([
      Review.find(filter)
        .populate({
          path: "user",
          select: "name avatar",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Review.countDocuments(filter),

      Review.aggregate([
        {
          $match: filter,
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
                    $eq: ["$rating", 5],
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
                    $eq: ["$rating", 4],
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
                    $eq: ["$rating", 3],
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
                    $eq: ["$rating", 2],
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
                    $eq: ["$rating", 1],
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

    // -------------------------------------------------
    // Rating Summary
    // -------------------------------------------------

    const ratingSummary = summary[0] || {
      averageRating: 0,
      total: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    };

    ratingSummary.averageRating = Number(
      (ratingSummary.averageRating || 0).toFixed(2),
    );

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Reviews fetched successfully",

      data: reviews,

      pagination: {
        page: currentPage,
        limit: perPage,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / perPage),
      },

      ratingSummary,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE REVIEW
// POST /api/reviews
// AUTHENTICATED USER
// =====================================================

const createReview = async (req, res, next) => {
  try {
    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Request Body
    // -------------------------------------------------

    const { productId, rating, title = "", comment } = req.body;

    // -------------------------------------------------
    // Product
    // -------------------------------------------------

    if (!isValidObjectId(productId)) {
      return next(new ApiError(400, "Invalid product ID"));
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isDeleted: false,
    }).select("_id");

    if (!product) {
      return next(new ApiError(404, "Product not found"));
    }

    // -------------------------------------------------
    // Rating
    // -------------------------------------------------

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return next(new ApiError(400, "Rating must be between 1 and 5"));
    }

    // -------------------------------------------------
    // Comment
    // -------------------------------------------------

    if (typeof comment !== "string" || !comment.trim()) {
      return next(new ApiError(400, "Review comment is required"));
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length < 3) {
      return next(
        new ApiError(400, "Review comment must contain at least 3 characters"),
      );
    }

    if (trimmedComment.length > 2000) {
      return next(
        new ApiError(400, "Review comment cannot exceed 2000 characters"),
      );
    }

    // -------------------------------------------------
    // Title
    // -------------------------------------------------

    const trimmedTitle = typeof title === "string" ? title.trim() : "";

    if (trimmedTitle.length > 200) {
      return next(
        new ApiError(400, "Review title cannot exceed 200 characters"),
      );
    }

    // -------------------------------------------------
    // Existing Review
    // -------------------------------------------------

    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    }).lean();

    if (existingReview) {
      return next(new ApiError(409, "You have already submitted a review"));
    }

    // -------------------------------------------------
    // CREATE REVIEW
    // -------------------------------------------------

    const review = await Review.create({
      user: userId,

      product: productId,

      rating: numericRating,

      title: trimmedTitle,

      comment: trimmedComment,

      status: "approved",

      isVerifiedPurchase: false,
    });

    // -------------------------------------------------
    // Populate Created Review
    // -------------------------------------------------

    const createdReview = await Review.findById(review._id)
      .populate({
        path: "user",
        select: "name avatar",
      })
      .lean();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message: "Review created successfully",

      data: createdReview,
    });
  } catch (error) {
    // -------------------------------------------------
    // Duplicate Key
    // -------------------------------------------------

    if (error?.code === 11000) {
      return next(new ApiError(409, "You have already submitted a review"));
    }

    next(error);
  }
};

// =====================================================
// GET MY REVIEW
// GET /api/reviews/my
// AUTHENTICATED USER
// =====================================================

const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    const reviews = await Review.find({
      user: userId,
    })
      .populate({
        path: "user",
        select: "name avatar",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      message: "Your reviews fetched successfully",

      count: reviews.length,

      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE MY REVIEW
// PATCH /api/reviews/:reviewId
// AUTHENTICATED USER
// =====================================================

const updateReview = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { reviewId } = req.params;

    const { rating, title, comment } = req.body;

    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Review ID
    // -------------------------------------------------

    if (!isValidObjectId(reviewId)) {
      return next(new ApiError(400, "Invalid review ID"));
    }

    // -------------------------------------------------
    // Find User's Review
    // -------------------------------------------------

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return next(new ApiError(404, "Review not found"));
    }

    // -------------------------------------------------
    // Rating
    // -------------------------------------------------

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return next(new ApiError(400, "Rating must be between 1 and 5"));
      }

      review.rating = numericRating;
    }

    // -------------------------------------------------
    // Title
    // -------------------------------------------------

    if (title !== undefined) {
      if (typeof title !== "string") {
        return next(new ApiError(400, "Review title must be a string"));
      }

      const trimmedTitle = title.trim();

      if (trimmedTitle.length > 200) {
        return next(
          new ApiError(400, "Review title cannot exceed 200 characters"),
        );
      }

      review.title = trimmedTitle;
    }

    // -------------------------------------------------
    // Comment
    // -------------------------------------------------

    if (comment !== undefined) {
      if (typeof comment !== "string" || !comment.trim()) {
        return next(new ApiError(400, "Review comment is required"));
      }

      const trimmedComment = comment.trim();

      if (trimmedComment.length < 3) {
        return next(
          new ApiError(
            400,
            "Review comment must contain at least 3 characters",
          ),
        );
      }

      if (trimmedComment.length > 2000) {
        return next(
          new ApiError(400, "Review comment cannot exceed 2000 characters"),
        );
      }

      review.comment = trimmedComment;
    }

    // -------------------------------------------------
    // Save
    // -------------------------------------------------

    review.status = "approved";

    review.rejectionReason = "";

    review.moderatedBy = null;

    review.moderatedAt = null;

    review.isVerifiedPurchase = false;

    await review.save();

    // -------------------------------------------------
    // Populate
    // -------------------------------------------------

    const updatedReview = await Review.findById(review._id)
      .populate({
        path: "user",
        select: "name avatar",
      })
      .lean();

    return res.status(200).json({
      success: true,

      message: "Review updated successfully",

      data: updatedReview,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new ApiError(409, "You have already submitted a review"));
    }

    next(error);
  }
};

// =====================================================
// DELETE MY REVIEW
// DELETE /api/reviews/:reviewId
// AUTHENTICATED USER
// =====================================================

const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { reviewId } = req.params;

    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    if (!userId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Review ID
    // -------------------------------------------------

    if (!isValidObjectId(reviewId)) {
      return next(new ApiError(400, "Invalid review ID"));
    }

    // -------------------------------------------------
    // Delete User's Review
    // -------------------------------------------------

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return next(new ApiError(404, "Review not found"));
    }

    return res.status(200).json({
      success: true,

      message: "Review deleted successfully",

      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN GET REVIEWS
// GET /api/reviews/admin
// =====================================================

const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, rating } = req.query;

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const currentPage = Math.max(Number(page) || 1, 1);

    const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);

    // -------------------------------------------------
    // Filter
    // -------------------------------------------------

    const filter = {};

    // -------------------------------------------------
    // Status
    // -------------------------------------------------

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!allowedStatuses.includes(status)) {
        return next(new ApiError(400, "Invalid review status"));
      }

      filter.status = status;
    }

    // -------------------------------------------------
    // Rating
    // -------------------------------------------------

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return next(new ApiError(400, "Invalid rating"));
      }

      filter.rating = numericRating;
    }

    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    const skip = (currentPage - 1) * perPage;

    // -------------------------------------------------
    // Fetch Reviews
    // -------------------------------------------------

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate({
          path: "user",
          select: "name email avatar",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      message: "Reviews fetched successfully",

      count: reviews.length,

      data: reviews,

      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN MODERATE REVIEW
// PATCH /api/reviews/admin/:reviewId
// =====================================================

const moderateReview = async (req, res, next) => {
  try {
    const adminId = req.user?._id;

    const { reviewId } = req.params;

    const { status, rejectionReason = "" } = req.body;

    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    if (!adminId) {
      return next(new ApiError(401, "Authentication required"));
    }

    // -------------------------------------------------
    // Review ID
    // -------------------------------------------------

    if (!isValidObjectId(reviewId)) {
      return next(new ApiError(400, "Invalid review ID"));
    }

    // -------------------------------------------------
    // Status
    // -------------------------------------------------

    if (!["pending", "approved", "rejected"].includes(status)) {
      return next(new ApiError(400, "Invalid review status"));
    }

    // -------------------------------------------------
    // Rejection Reason
    // -------------------------------------------------

    if (status === "rejected" && !String(rejectionReason).trim()) {
      return next(
        new ApiError(
          400,
          "Rejection reason is required when rejecting a review",
        ),
      );
    }

    if (String(rejectionReason).trim().length > 500) {
      return next(
        new ApiError(400, "Rejection reason cannot exceed 500 characters"),
      );
    }

    // -------------------------------------------------
    // Find Review
    // -------------------------------------------------

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(new ApiError(404, "Review not found"));
    }

    // -------------------------------------------------
    // Update
    // -------------------------------------------------

    review.status = status;

    review.moderatedBy = adminId;

    review.moderatedAt = new Date();

    review.rejectionReason =
      status === "rejected" ? String(rejectionReason).trim() : "";

    await review.save();

    // -------------------------------------------------
    // Populate
    // -------------------------------------------------

    const updatedReview = await Review.findById(review._id)
      .populate({
        path: "user",
        select: "name email avatar",
      })
      .lean();

    return res.status(200).json({
      success: true,

      message: `Review ${status} successfully`,

      data: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN DELETE REVIEW
// DELETE /api/reviews/admin/:reviewId
// =====================================================

const deleteReviewAdmin = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // -------------------------------------------------
    // Validate Review ID
    // -------------------------------------------------

    if (!isValidObjectId(reviewId)) {
      return next(new ApiError(400, "Invalid review ID"));
    }

    // -------------------------------------------------
    // Delete
    // -------------------------------------------------

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return next(new ApiError(404, "Review not found"));
    }

    return res.status(200).json({
      success: true,

      message: "Review deleted successfully",

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
  getReviews,
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReviewAdmin,
};
