const express = require("express");

const router = express.Router();

const {
  getReviews,
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  moderateReview,
  deleteReviewAdmin,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const {
  reviewLimiter,
  adminLimiter,
} = require("../middleware/rateLimitterMiddleware");

const {
  validateReviewId,
  validateCreateReview,
  validateUpdateReview,
  validateModerateReview,
} = require("../validator/reviewValidator");

// =====================================================
// AUTHENTICATED USER
// =====================================================

// All review user routes require authentication.

router.use(authMiddleware);

// =====================================================
// GET ALL REVIEWS
// =====================================================

// GET /api/reviews

router.get("/", reviewLimiter, getReviews);

// =====================================================
// CREATE REVIEW
// =====================================================

// POST /api/reviews

router.post("/", reviewLimiter, validateCreateReview, createReview);

// =====================================================
// MY REVIEWS
// =====================================================

// GET /api/reviews/my

router.get("/my", reviewLimiter, getMyReviews);

// =====================================================
// UPDATE MY REVIEW
// =====================================================

// PATCH /api/reviews/:reviewId

router.patch(
  "/:reviewId",
  reviewLimiter,
  validateReviewId,
  validateUpdateReview,
  updateReview,
);

// =====================================================
// DELETE MY REVIEW
// =====================================================

// DELETE /api/reviews/:reviewId

router.delete("/:reviewId", reviewLimiter, validateReviewId, deleteReview);

// =====================================================
// ADMIN
// =====================================================

// GET ALL REVIEWS
// GET /api/reviews/admin

router.get("/admin", adminLimiter, authorizeRoles("admin"), getAllReviewsAdmin);

// =====================================================
// ADMIN MODERATE REVIEW
// =====================================================

// PATCH /api/reviews/admin/:reviewId

router.patch(
  "/admin/:reviewId",
  adminLimiter,
  authorizeRoles("admin"),
  validateReviewId,
  validateModerateReview,
  moderateReview,
);

// =====================================================
// ADMIN DELETE REVIEW
// =====================================================

// DELETE /api/reviews/admin/:reviewId

router.delete(
  "/admin/:reviewId",
  adminLimiter,
  authorizeRoles("admin"),
  validateReviewId,
  deleteReviewAdmin,
);

module.exports = router;
