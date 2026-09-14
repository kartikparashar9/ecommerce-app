import React, { useEffect, useMemo, useState } from "react";

import { getProductReviewsApi } from "../../ProductApi";

import "./ProductReviews.css";

const ProductReviews = ({
  productId,
  averageRating = 0,
  totalReviews = 0,
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState("");

  // =====================================================
  // LOAD PRODUCT REVIEWS
  // =====================================================

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
        setReviews([]);

        const data = await getProductReviewsApi(productId);

        if (!mounted) {
          return;
        }

        const reviewList = Array.isArray(data)
          ? data
          : Array.isArray(data?.reviews)
            ? data.reviews
            : [];

        setReviews(reviewList.filter(Boolean));
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

  // =====================================================
  // NORMALIZED PRODUCT RATING
  // =====================================================

  const productRating = useMemo(() => {
    const rating = Number(averageRating);

    if (!Number.isFinite(rating)) {
      return 0;
    }

    return Math.min(Math.max(rating, 0), 5);
  }, [averageRating]);

  // =====================================================
  // RATING DISTRIBUTION
  // =====================================================

  const distribution = useMemo(() => {
    const result = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Number(review?.rating);

      if (
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
      ) {
        result[rating] += 1;
      }
    });

    return result;
  }, [reviews]);

  // =====================================================
  // TOTAL REVIEWS
  // =====================================================

  const backendReviewCount = Number(totalReviews);

  const reviewTotal =
    reviews.length > 0
      ? reviews.length
      : Number.isFinite(backendReviewCount) &&
          backendReviewCount > 0
        ? backendReviewCount
        : 0;

  // =====================================================
  // REVIEW USER
  // =====================================================

  const getReviewerName = (review) => {
    const name =
      review?.user?.name ||
      review?.userName ||
      review?.name ||
      "User";

    return typeof name === "string" && name.trim()
      ? name.trim()
      : "User";
  };

  // =====================================================
  // REVIEW RATING
  // =====================================================

  const getReviewRating = (review) => {
    const rating = Number(review?.rating);

    if (!Number.isFinite(rating)) {
      return 0;
    }

    return Math.min(Math.max(rating, 0), 5);
  };

  // =====================================================
  // RENDER
  // =====================================================

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

          <small>
            {reviewTotal} Reviews
          </small>
        </div>
      </div>

      {/* =================================================
          RATING DISTRIBUTION
          ================================================= */}

      <div className="product-reviews__distribution">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating];

          const percentage =
            reviewTotal > 0
              ? Math.round(
                  (count / reviewTotal) * 100,
                )
              : 0;

          return (
            <div
              className="product-reviews__bar-row"
              key={rating}
            >
              <span>{rating} ★</span>

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
          REVIEWS
          ================================================= */}

      <div className="product-reviews__list">
        {loading && (
          <p className="product-reviews__status">
            Loading reviews...
          </p>
        )}

        {!loading && error && (
          <p className="product-reviews__status product-reviews__status--error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          reviews.length === 0 && (
            <p className="product-reviews__status">
              No reviews available yet.
            </p>
          )}

        {!loading &&
          !error &&
          reviews.length > 0 &&
          reviews.map((review, index) => {
            const reviewerName =
              getReviewerName(review);

            const rating =
              getReviewRating(review);

            const reviewKey =
              review?._id ||
              `${review?.createdAt || "review"}-${review?.rating || 0}-${index}`;

            return (
              <article
                className="product-review"
                key={reviewKey}
              >
                {/* =========================================
                    REVIEW HEADER
                    ========================================= */}

                <div className="product-review__top">
                  <div className="product-review__user">
                    <span>
                      {reviewerName
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>
                        {reviewerName}
                      </strong>

                      {review?.isVerifiedPurchase && (
                        <small>
                          ✓ Verified Purchase
                        </small>
                      )}
                    </div>
                  </div>

                  {/* =======================================
                      REVIEW STARS
                      ======================================= */}

                  <div className="product-review__rating">
                    {Array.from({
                      length: 5,
                    }).map((_, starIndex) => (
                      <span
                        key={starIndex}
                        className={
                          starIndex < rating
                            ? "active"
                            : ""
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {/* =========================================
                    REVIEW TITLE
                    ========================================= */}

                {typeof review?.title ===
                  "string" &&
                  review.title.trim() && (
                    <h3>
                      {review.title.trim()}
                    </h3>
                  )}

                {/* =========================================
                    REVIEW COMMENT
                    ========================================= */}

                {typeof review?.comment ===
                  "string" &&
                  review.comment.trim() && (
                    <p>
                      {review.comment.trim()}
                    </p>
                  )}
              </article>
            );
          })}
      </div>
    </section>
  );
};

export default ProductReviews;

