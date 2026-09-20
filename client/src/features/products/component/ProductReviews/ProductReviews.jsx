import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  createReviewApi,
  deleteReviewApi,
  getProductReviewsApi,
  updateReviewApi,
} from "../../../review/ReviewApi";

import "./ProductReviews.css";

// =====================================================
// PRODUCT REVIEWS
// =====================================================

const extractReview = (value) => {
  const data = value?.data ?? value;

  if (data?.review && typeof data.review === "object") {
    return data.review;
  }

  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    if (data.data.review && typeof data.data.review === "object") {
      return data.data.review;
    }
    if (data.data.rating != null && data.data.comment) {
      return data.data;
    }
  }

  if (data && typeof data === "object" && data.rating != null && data.comment) {
    return data;
  }

  return null;
};

const normalizeReviewList = (value) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data.filter(Boolean);
  if (Array.isArray(data?.reviews)) return data.reviews.filter(Boolean);
  if (Array.isArray(data?.data)) return data.data.filter(Boolean);
  return [];
};

const ProductReviews = ({ productId, averageRating = 0, totalReviews = 0 }) => {
  const navigate = useNavigate();

  // ===================================================
  // AUTH
  // ===================================================

  // Select only the primitive value.
  // This avoids the Redux selector stability warning.
  const authUser = useSelector((state) => state.auth?.user || null);
  const isAuthenticated = useSelector((state) =>
    Boolean(state.auth?.isAuthenticated),
  );

  // ===================================================
  // REVIEW STATE
  // ===================================================

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState("");

  // ===================================================
  // FORM STATE
  // ===================================================

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  // ===================================================
  // LOAD PRODUCT REVIEWS
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      if (!productId) {
        if (mounted) {
          setReviews([]);
          setLoading(false);
          setError("");
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getProductReviewsApi(productId);

        if (!mounted) {
          return;
        }

        setReviews(normalizeReviewList(data));
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setReviews([]);

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load reviews",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [productId]);

  // ===================================================
  // NORMALIZED PRODUCT RATING
  // ===================================================

  const productRating = useMemo(() => {
    const ratingValue = Number(averageRating);

    if (!Number.isFinite(ratingValue)) {
      return 0;
    }

    return Math.min(Math.max(ratingValue, 0), 5);
  }, [averageRating]);

  // ===================================================
  // RATING DISTRIBUTION
  // ===================================================

  const distribution = useMemo(() => {
    const result = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const reviewRating = Number(review?.rating);

      if (
        Number.isInteger(reviewRating) &&
        reviewRating >= 1 &&
        reviewRating <= 5
      ) {
        result[reviewRating] += 1;
      }
    });

    return result;
  }, [reviews]);

  // ===================================================
  // TOTAL REVIEWS
  // ===================================================

  const backendReviewCount = Number(totalReviews);

  const reviewTotal =
    reviews.length > 0
      ? reviews.length
      : Number.isFinite(backendReviewCount) && backendReviewCount > 0
        ? backendReviewCount
        : 0;

  // ===================================================
  // REVIEWER NAME
  // ===================================================

  const getReviewerName = (review) => {
    const name =
      review?.user?.name || review?.userName || review?.name || "User";

    return typeof name === "string" && name.trim() ? name.trim() : "User";
  };

  // ===================================================
  // REVIEW OWNERSHIP
  // ===================================================

  const isMyReview = (review) => {
    const currentUserId = authUser?._id || authUser?.id;
    const reviewUserId = review?.user?._id || review?.user?.id || review?.user;

    return Boolean(
      currentUserId &&
        reviewUserId &&
        String(currentUserId) === String(reviewUserId),
    );
  };

  // ===================================================
  // REVIEW RATING
  // ===================================================

  const getReviewRating = (review) => {
    const ratingValue = Number(review?.rating);

    if (!Number.isFinite(ratingValue)) {
      return 0;
    }

    return Math.min(Math.max(ratingValue, 0), 5);
  };

  // ===================================================
  // START EDIT
  // ===================================================

  const startEditReview = (review) => {
    setEditingReviewId(review?._id || null);
    setRating(Number(review?.rating) || 0);
    setTitle(review?.title || "");
    setComment(review?.comment || "");
    setSubmitError("");
    setSubmitMessage("");
  };

  // ===================================================
  // CANCEL EDIT
  // ===================================================

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setRating(0);
    setTitle("");
    setComment("");
    setSubmitError("");
    setSubmitMessage("");
  };

  // ===================================================
  // DELETE REVIEW
  // ===================================================

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || deletingReviewId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      setSubmitError("");
      setSubmitMessage("");

      await deleteReviewApi(reviewId);

      setReviews((previousReviews) =>
        previousReviews.filter(
          (review) => String(review?._id) !== String(reviewId),
        ),
      );

      if (String(editingReviewId) === String(reviewId)) {
        cancelEditReview();
      }

      setSubmitMessage("Review deleted successfully.");
    } catch (requestError) {
      setSubmitError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to delete review.",
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  // ===================================================
  // SUBMIT REVIEW
  // ===================================================

  const submitReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
        },
      });

      return;
    }

    setSubmitError("");
    setSubmitMessage("");

    const trimmedTitle = title.trim();
    const trimmedComment = comment.trim();

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!productId) {
      setSubmitError("Product information is missing.");

      return;
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1) {
      setSubmitError("Please select a rating.");

      return;
    }

    if (Number(rating) > 5) {
      setSubmitError("Rating must be between 1 and 5.");

      return;
    }

    if (!trimmedComment) {
      setSubmitError("Please write your review.");

      return;
    }

    if (trimmedComment.length > 2000) {
      setSubmitError("Review comment must be 2000 characters or less.");

      return;
    }

    if (trimmedTitle.length > 120) {
      setSubmitError("Review title must be 120 characters or less.");

      return;
    }

    // -----------------------------------------------
    // CREATE REVIEW
    // -----------------------------------------------

    try {
      setSubmitting(true);

      const payload = {
        productId: String(productId),
        rating: Number(rating),
        title: trimmedTitle || undefined,
        comment: trimmedComment,
      };

      if (editingReviewId) {
        const response = await updateReviewApi(editingReviewId, payload);
        const updatedReview = extractReview(response);

        if (updatedReview) {
          setReviews((previousReviews) =>
            previousReviews.map((review) =>
              String(review?._id) === String(editingReviewId)
                ? updatedReview
                : review,
            ),
          );
        } else {
          const refreshedData = await getProductReviewsApi(productId);
          setReviews(normalizeReviewList(refreshedData));
        }

        setSubmitMessage("Review updated successfully.");
      } else {
        const response = await createReviewApi(payload);
        const createdReview = extractReview(response);

        if (createdReview) {
          setReviews((previousReviews) => [
            createdReview,
            ...previousReviews,
          ]);
        } else {
          const refreshedData = await getProductReviewsApi(productId);
          setReviews(normalizeReviewList(refreshedData));
        }

        setSubmitMessage("Review submitted successfully.");
      }

      setEditingReviewId(null);
      setRating(0);
      setTitle("");
      setComment("");
    } catch (requestError) {
      setSubmitError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section className="product-reviews">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="product-reviews__header">
        <h2>Ratings & Reviews</h2>

        <div className="product-reviews__summary">
          <strong>{productRating.toFixed(1)}</strong>

          <span>★</span>

          <small>{reviewTotal} Reviews</small>
        </div>
      </div>

      {/* =================================================
          WRITE REVIEW
      ================================================= */}

      <div className="product-reviews__form">
        <div className="product-reviews__form-header">
          <h3>{editingReviewId ? "Edit Your Review" : "Write a Review"}</h3>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() =>
                navigate("/login", {
                  state: {
                    from: window.location.pathname,
                  },
                })
              }
            >
              Login to Review
            </button>
          )}
        </div>

        {isAuthenticated && (
          <form onSubmit={submitReview}>
            {/* =========================================
                RATING
            ========================================= */}

            <div className="product-reviews__rating-input">
              <label>Your Rating</label>

              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? "active" : ""}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* =========================================
                TITLE
            ========================================= */}

            <div className="product-reviews__field">
              <label htmlFor="review-title">Review Title</label>

              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give your review a title"
                maxLength={120}
                disabled={submitting}
              />
            </div>

            {/* =========================================
                COMMENT
            ========================================= */}

            <div className="product-reviews__field">
              <label htmlFor="review-comment">Your Review</label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Share your experience with this product"
                rows={5}
                maxLength={2000}
                disabled={submitting}
              />
            </div>

            {/* =========================================
                FORM ERROR
            ========================================= */}

            {submitError && (
              <p className="product-reviews__status product-reviews__status--error">
                {submitError}
              </p>
            )}

            {/* =========================================
                FORM SUCCESS
            ========================================= */}

            {submitMessage && (
              <p className="product-reviews__status">{submitMessage}</p>
            )}

            {/* =========================================
                SUBMIT
            ========================================= */}

            <div className="product-reviews__form-actions">
              <button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingReviewId
                    ? "Update Review"
                    : "Submit Review"}
              </button>

              {editingReviewId && (
                <button
                  type="button"
                  className="product-reviews__cancel-button"
                  onClick={cancelEditReview}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* =================================================
          RATING DISTRIBUTION
      ================================================= */}

      <div className="product-reviews__distribution">
        {[5, 4, 3, 2, 1].map((ratingValue) => {
          const count = distribution[ratingValue];

          const percentage =
            reviewTotal > 0 ? Math.round((count / reviewTotal) * 100) : 0;

          return (
            <div className="product-reviews__bar-row" key={ratingValue}>
              <span>{ratingValue} ★</span>

              <div className="product-reviews__bar">
                <div
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <small>{percentage}%</small>
            </div>
          );
        })}
      </div>

      {/* =================================================
          REVIEWS LIST
      ================================================= */}

      <div className="product-reviews__list">
        {loading && (
          <p className="product-reviews__status">Loading reviews...</p>
        )}

        {!loading && error && (
          <p className="product-reviews__status product-reviews__status--error">
            {error}
          </p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <p className="product-reviews__status">No reviews available yet.</p>
        )}

        {!loading &&
          !error &&
          reviews.length > 0 &&
          reviews.map((review, index) => {
            const reviewerName = getReviewerName(review);

            const reviewRating = getReviewRating(review);

            const reviewKey =
              review?._id ||
              `${review?.createdAt || "review"}-${review?.rating || 0}-${index}`;

            return (
              <article className="product-review" key={reviewKey}>
                {/* =======================================
                    REVIEW HEADER
                ======================================= */}

                <div className="product-review__top">
                  <div className="product-review__user">
                    <span>{reviewerName.charAt(0).toUpperCase()}</span>

                    <div>
                      <strong>{reviewerName}</strong>

                      {review?.isVerifiedPurchase && (
                        <small>✓ Verified Purchase</small>
                      )}
                    </div>
                  </div>

                  {/* =====================================
                      REVIEW STARS
                  ===================================== */}

                  <div className="product-review__rating">
                    {Array.from({
                      length: 5,
                    }).map((_, starIndex) => (
                      <span
                        key={starIndex}
                        className={starIndex < reviewRating ? "active" : ""}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {isMyReview(review) && (
                  <div className="product-review__actions">
                    <button
                      type="button"
                      onClick={() => startEditReview(review)}
                      disabled={Boolean(deletingReviewId)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="product-review__delete"
                      onClick={() => handleDeleteReview(review?._id)}
                      disabled={deletingReviewId === review?._id}
                    >
                      {deletingReviewId === review?._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                )}

                {/* =======================================
                    REVIEW TITLE
                ======================================= */}

                {typeof review?.title === "string" && review.title.trim() && (
                  <h3>{review.title.trim()}</h3>
                )}

                {/* =======================================
                    REVIEW COMMENT
                ======================================= */}

                {typeof review?.comment === "string" &&
                  review.comment.trim() && <p>{review.comment.trim()}</p>}
              </article>
            );
          })}
      </div>
    </section>
  );
};

export default ProductReviews;
