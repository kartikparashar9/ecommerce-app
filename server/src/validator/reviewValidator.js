const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

// =====================================================
// OBJECT ID VALIDATOR
// =====================================================

const validateObjectId = (value, fieldName) => {
  if (!value) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return true;
};

// =====================================================
// REVIEW ID
// =====================================================

const validateReviewId = (req, res, next) => {
  try {
    validateObjectId(req.params.reviewId, "review ID");

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE REVIEW
// =====================================================
// User sends:
// productId
// rating
// title
// comment
//
// user ID comes from authentication:
// req.user._id
// =====================================================

const validateCreateReview = (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    // -------------------------------------------------
    // Product
    // -------------------------------------------------

    validateObjectId(productId, "product ID");

    // -------------------------------------------------
    // Rating
    // -------------------------------------------------

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new ApiError(400, "Rating must be a whole number from 1 to 5");
    }

    // -------------------------------------------------
    // Title
    // -------------------------------------------------

    if (title !== undefined && typeof title !== "string") {
      throw new ApiError(400, "Review title must be a string");
    }

    if (typeof title === "string" && title.trim().length > 200) {
      throw new ApiError(400, "Review title cannot exceed 200 characters");
    }

    // -------------------------------------------------
    // Comment
    // -------------------------------------------------

    if (typeof comment !== "string" || comment.trim().length < 3) {
      throw new ApiError(
        400,
        "Review comment must contain at least 3 characters",
      );
    }

    if (comment.trim().length > 2000) {
      throw new ApiError(400, "Review comment cannot exceed 2000 characters");
    }

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE REVIEW
// =====================================================

const validateUpdateReview = (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    // -------------------------------------------------
    // At least one field
    // -------------------------------------------------

    if (rating === undefined && title === undefined && comment === undefined) {
      throw new ApiError(400, "At least one review field is required");
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
        throw new ApiError(400, "Rating must be a whole number from 1 to 5");
      }
    }

    // -------------------------------------------------
    // Title
    // -------------------------------------------------

    if (title !== undefined && typeof title !== "string") {
      throw new ApiError(400, "Review title must be a string");
    }

    if (typeof title === "string" && title.trim().length > 200) {
      throw new ApiError(400, "Review title cannot exceed 200 characters");
    }

    // -------------------------------------------------
    // Comment
    // -------------------------------------------------

    if (comment !== undefined) {
      if (typeof comment !== "string") {
        throw new ApiError(400, "Review comment must be a string");
      }

      if (comment.trim().length < 3) {
        throw new ApiError(
          400,
          "Review comment must contain at least 3 characters",
        );
      }

      if (comment.trim().length > 2000) {
        throw new ApiError(400, "Review comment cannot exceed 2000 characters");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN MODERATION
// =====================================================

const validateModerateReview = (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];

    // -------------------------------------------------
    // Status
    // -------------------------------------------------

    if (!status || typeof status !== "string") {
      throw new ApiError(400, "Review status is required");
    }

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid review moderation status");
    }

    // -------------------------------------------------
    // Rejection Reason
    // -------------------------------------------------

    if (rejectionReason !== undefined && typeof rejectionReason !== "string") {
      throw new ApiError(400, "Rejection reason must be a string");
    }

    if (
      status === "rejected" &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      throw new ApiError(
        400,
        "Rejection reason is required when rejecting a review",
      );
    }

    if (
      typeof rejectionReason === "string" &&
      rejectionReason.trim().length > 500
    ) {
      throw new ApiError(400, "Rejection reason cannot exceed 500 characters");
    }

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  validateReviewId,
  validateCreateReview,
  validateUpdateReview,
  validateModerateReview,
};
