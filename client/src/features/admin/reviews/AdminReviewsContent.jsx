import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Star,
  Trash2,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CalendarDays,
  Package,
  SlidersHorizontal,
  RotateCcw,
  Clock3,
  AlertCircle,
} from "lucide-react";

import {
  getAllReviewsAdmin,
  moderateReview,
  deleteReviewAdmin,
} from "../AdminApi";

import "./AdminReviewsContent.css";

import { resolveMediaUrl, getInitial } from "../../utils/media";

const LIMIT = 10;

const DEFAULT_PAGINATION = {
  page: 1,
  totalPages: 1,
  totalReviews: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const EMPTY_STATS = {
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
};

const AdminReviewsContent = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [reviews, setReviews] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [stats, setStats] = useState(EMPTY_STATS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(null);

  const [goToPage, setGoToPage] = useState("");

  // =====================================================
  // NORMALIZE API RESPONSE
  // =====================================================

  const normalizeResponse = useCallback(
    (response) => {
      const root = response?.data ?? response ?? {};

      const data = root?.data ?? root;

      let reviewList = [];

      if (Array.isArray(data)) {
        reviewList = data;
      } else if (Array.isArray(data?.reviews)) {
        reviewList = data.reviews;
      } else if (Array.isArray(data?.data)) {
        reviewList = data.data;
      } else if (Array.isArray(root?.reviews)) {
        reviewList = root.reviews;
      }

      const rawPagination =
        data?.pagination || root?.pagination || data?.meta || root?.meta || {};

      const normalizedPagination = {
        page:
          Number(
            rawPagination?.page ??
              rawPagination?.currentPage ??
              rawPagination?.current_page,
          ) || page,

        totalPages:
          Number(
            rawPagination?.totalPages ??
              rawPagination?.total_pages ??
              rawPagination?.pages,
          ) || 1,

        totalReviews:
          Number(
            rawPagination?.totalReviews ??
              rawPagination?.total ??
              rawPagination?.count ??
              rawPagination?.totalCount,
          ) || 0,

        hasPreviousPage:
          typeof rawPagination?.hasPreviousPage === "boolean"
            ? rawPagination.hasPreviousPage
            : typeof rawPagination?.hasPrevPage === "boolean"
              ? rawPagination.hasPrevPage
              : typeof rawPagination?.hasPrevious === "boolean"
                ? rawPagination.hasPrevious
                : page > 1,

        hasNextPage:
          typeof rawPagination?.hasNextPage === "boolean"
            ? rawPagination.hasNextPage
            : typeof rawPagination?.hasNext === "boolean"
              ? rawPagination.hasNext
              : page <
                (Number(
                  rawPagination?.totalPages ??
                    rawPagination?.total_pages ??
                    rawPagination?.pages,
                ) || 1),
      };

      /*
       * If backend sends statistics, use them.
       * Otherwise calculate statistics from currently loaded reviews.
       */
      const rawStats =
        data?.stats ||
        data?.statistics ||
        root?.stats ||
        root?.statistics ||
        {};

      const calculatedStats = reviewList.reduce(
        (result, review) => {
          const reviewStatus = String(review?.status || "").toLowerCase();

          result.total += 1;

          if (reviewStatus === "approved") {
            result.approved += 1;
          } else if (reviewStatus === "pending") {
            result.pending += 1;
          } else if (reviewStatus === "rejected") {
            result.rejected += 1;
          }

          return result;
        },
        {
          ...EMPTY_STATS,
        },
      );

      const finalStats = {
        total:
          Number(
            rawStats?.total ?? rawStats?.totalReviews ?? rawStats?.reviews,
          ) ||
          normalizedPagination.totalReviews ||
          calculatedStats.total,

        approved:
          Number(rawStats?.approved ?? rawStats?.approvedReviews) ||
          calculatedStats.approved,

        pending:
          Number(rawStats?.pending ?? rawStats?.pendingReviews) ||
          calculatedStats.pending,

        rejected:
          Number(rawStats?.rejected ?? rawStats?.rejectedReviews) ||
          calculatedStats.rejected,
      };

      return {
        reviews: reviewList,
        pagination: normalizedPagination,
        stats: finalStats,
      };
    },
    [page],
  );

  // =====================================================
  // LOAD REVIEWS
  // =====================================================

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: LIMIT,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      if (rating) {
        params.rating = rating;
      }

      const response = await getAllReviewsAdmin(params);

      const normalized = normalizeResponse(response);

      setReviews(normalized.reviews);

      setPagination({
        ...DEFAULT_PAGINATION,
        ...normalized.pagination,
      });

      setStats(normalized.stats);

      /*
       * If current page became invalid after delete/filter,
       * automatically move to the last valid page.
       */
      if (
        normalized.pagination.totalPages > 0 &&
        page > normalized.pagination.totalPages
      ) {
        setPage(normalized.pagination.totalPages);
      }
    } catch (err) {
      console.error("Admin reviews load error:", err);

      setReviews([]);

      setPagination(DEFAULT_PAGINATION);

      setStats(EMPTY_STATS);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to load reviews.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, rating, normalizeResponse]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // =====================================================
  // FILTER HANDLERS
  // =====================================================

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleRatingChange = (event) => {
    setRating(event.target.value);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setRating("");
    setPage(1);
    setGoToPage("");
  };

  // =====================================================
  // MODERATE REVIEW
  // =====================================================

  const handleModerate = async (reviewId, nextStatus) => {
    if (!reviewId || busy) {
      return;
    }

    let rejectionReason = "";

    if (nextStatus === "rejected") {
      const enteredReason = window.prompt("Enter rejection reason:");

      if (enteredReason === null) {
        return;
      }

      rejectionReason = enteredReason.trim();

      if (!rejectionReason) {
        window.alert("Rejection reason is required.");
        return;
      }
    }

    try {
      setBusy(reviewId);
      setError("");

      await moderateReview(reviewId, {
        status: nextStatus,
        rejectionReason,
      });

      await loadReviews();
    } catch (err) {
      console.error("Review moderation error:", err);

      window.alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to moderate review.",
      );
    } finally {
      setBusy(null);
    }
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDelete = async (reviewId) => {
    if (!reviewId || busy) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this review permanently?\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusy(reviewId);
      setError("");

      await deleteReviewAdmin(reviewId);

      /*
       * Reload first.
       * The API pagination tells us whether the page
       * is still valid.
       */
      await loadReviews();
    } catch (err) {
      console.error("Review delete error:", err);

      window.alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to delete review.",
      );
    } finally {
      setBusy(null);
    }
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const currentPage = Number(pagination?.page) || page || 1;

  const totalPages = Number(pagination?.totalPages) || 1;

  const totalReviews = Number(pagination?.totalReviews) || stats.total || 0;

  const handlePreviousPage = () => {
    if (loading || !pagination.hasPreviousPage || currentPage <= 1) {
      return;
    }

    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    if (loading || !pagination.hasNextPage || currentPage >= totalPages) {
      return;
    }

    setPage((current) => Math.min(totalPages, current + 1));
  };

  const handlePageClick = (pageNumber) => {
    if (
      loading ||
      pageNumber < 1 ||
      pageNumber > totalPages ||
      pageNumber === currentPage
    ) {
      return;
    }

    setPage(pageNumber);
  };

  const handleGoToPage = (event) => {
    event.preventDefault();

    const targetPage = Number(goToPage);

    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      window.alert(`Please enter a page number between 1 and ${totalPages}.`);
      return;
    }

    setPage(targetPage);
    setGoToPage("");
  };

  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) {
      return [1];
    }

    const pages = [];

    /*
     * Small number of pages:
     * show everything.
     */
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }

      return pages;
    }

    /*
     * Always show first page.
     */
    pages.push(1);

    /*
     * Left ellipsis.
     */
    if (currentPage > 4) {
      pages.push("left-ellipsis");
    }

    /*
     * Middle pages.
     */
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i += 1) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    /*
     * Right ellipsis.
     */
    if (currentPage < totalPages - 3) {
      pages.push("right-ellipsis");
    }

    /*
     * Always show last page.
     */
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (value) => {
    if (!value) {
      return "Unknown";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getProductImage = (review) => {
    const images = review?.product?.images;

    if (Array.isArray(images) && images.length) {
      const firstImage = images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage && typeof firstImage === "object") {
        return (
          firstImage.url ||
          firstImage.secure_url ||
          firstImage.path ||
          firstImage.src ||
          ""
        );
      }
    }

    return review?.product?.image || review?.product?.thumbnail || "";
  };

  const getVisibleStart = () => {
    if (!totalReviews || !reviews.length) {
      return 0;
    }

    return (currentPage - 1) * LIMIT + 1;
  };

  const getVisibleEnd = () => {
    if (!totalReviews || !reviews.length) {
      return 0;
    }

    return Math.min(currentPage * LIMIT, totalReviews);
  };

  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(status) || Boolean(rating);

  // =====================================================
  // SKELETON
  // =====================================================

  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div
        className="admin-review-card review-skeleton-card"
        key={`review-skeleton-${index}`}
      >
        <div className="skeleton-card-top">
          <div className="skeleton-header">
            <div className="skeleton-avatar" />

            <div className="skeleton-user">
              <div className="skeleton-line name" />
              <div className="skeleton-line email" />
            </div>
          </div>

          <div className="skeleton-status" />
        </div>

        <div className="skeleton-product">
          <div className="skeleton-product-image" />

          <div className="skeleton-product-details">
            <div className="skeleton-line product-name" />
            <div className="skeleton-line order" />
          </div>

          <div className="skeleton-rating" />
        </div>

        <div className="skeleton-line review-title" />

        <div className="skeleton-line review-text" />

        <div className="skeleton-line review-text medium" />

        <div className="skeleton-line review-text short" />

        <div className="skeleton-actions">
          <span />
          <span />
          <span />
        </div>
      </div>
    ));
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="admin-reviews-content">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-reviews-header">
        <div className="admin-reviews-header-left">
          <div className="admin-reviews-icon">
            <Star size={25} strokeWidth={2.2} />
          </div>

          <div className="admin-reviews-heading">
            <h1>Reviews</h1>

            <p>Manage and moderate customer reviews from your store.</p>
          </div>
        </div>

        <div>
          <button
          type="button"
          className="admin-reviews-refresh"
          onClick={loadReviews}
          disabled={loading}
          aria-label="Refresh reviews"
        >
          <RefreshCw
            size={16}
            className={loading ? "review-refresh-spin" : ""}
          />
          <span>Refresh</span>
        </button>
        </div>
      </header>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div className="admin-reviews-filters">
        <div className="reviews-search-box">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search reviews, product, or user..."
            aria-label="Search reviews"
          />

          {search && (
            <button
              type="button"
              className="reviews-search-clear"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="reviews-filter-field">
          <label htmlFor="review-status">Status</label>

          <select
            id="review-status"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="reviews-filter-field">
          <label htmlFor="review-rating">Rating</label>

          <select
            id="review-rating"
            value={rating}
            onChange={handleRatingChange}
          >
            <option value="">All Ratings</option>

            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} Stars
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`reviews-clear-button ${hasActiveFilters ? "active" : ""}`}
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
        >
          <RotateCcw size={14} />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="reviews-stats-grid">
        <div className="review-stat-card total">
          <div className="review-stat-icon">
            <MessageSquare size={19} />
          </div>

          <div className="review-stat-content">
            <strong>{stats.total}</strong>
            <span>Total Reviews</span>
          </div>
        </div>

        <div className="review-stat-card approved">
          <div className="review-stat-icon">
            <Check size={19} />
          </div>

          <div className="review-stat-content">
            <strong>{stats.approved}</strong>
            <span>Approved</span>
          </div>
        </div>

        <div className="review-stat-card pending">
          <div className="review-stat-icon">
            <Clock3 size={19} />
          </div>

          <div className="review-stat-content">
            <strong>{stats.pending}</strong>
            <span>Pending</span>
          </div>
        </div>

        <div className="review-stat-card rejected">
          <div className="review-stat-icon">
            <X size={19} />
          </div>

          <div className="review-stat-content">
            <strong>{stats.rejected}</strong>
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="admin-reviews-error">
          <div className="reviews-error-left">
            <div className="reviews-error-icon">
              <AlertCircle size={17} />
            </div>

            <div className="reviews-error-content">
              <strong>Something went wrong</strong>

              <span>{error}</span>
            </div>
          </div>

          <button type="button" onClick={loadReviews}>
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          CONTENT
      ================================================= */}

      {loading ? (
        <div className="admin-reviews-grid">{renderSkeletons()}</div>
      ) : !reviews.length ? (
        <div className="admin-reviews-empty">
          <div className="reviews-empty-icon">
            <MessageSquare size={28} />
          </div>

          <h2>No reviews found</h2>

          <p>
            {hasActiveFilters
              ? "No reviews match your current filters. Try changing your search or filters."
              : "There are no customer reviews available yet."}
          </p>

          {hasActiveFilters && (
            <button type="button" onClick={handleResetFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* =================================================
              REVIEW GRID
          ================================================= */}

          <div className="admin-reviews-grid">
            {reviews.map((review) => {
              const reviewId = review?._id;

              const userName = review?.user?.name || "Unknown User";

              const userEmail = review?.user?.email || "";

              const productName = review?.product?.name || "Unknown Product";

              const reviewRating = Math.min(
                5,
                Math.max(0, Number(review?.rating) || 0),
              );

              const productImage = getProductImage(review);

              const isBusy = busy === reviewId;

              const reviewDate = review?.createdAt || review?.updatedAt;

              const reviewStatus = String(
                review?.status || "unknown",
              ).toLowerCase();

              return (
                <article className="admin-review-card" key={reviewId}>
                  {/* =====================================
                      TOP
                  ===================================== */}

                  <div className="review-card-top">
                    <div className="review-user">
                      <div className="review-avatar">
                        {review?.user?.avatar ? (
                          <>
                            <img
                              src={resolveMediaUrl(review.user.avatar)}
                              alt={`${userName} avatar`}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";

                                const fallback =
                                  event.currentTarget.nextElementSibling;

                                if (fallback) {
                                  fallback.hidden = false;
                                }
                              }}
                            />

                            <span className="review-avatar-fallback" hidden>
                              {getInitial(userName)}
                            </span>
                          </>
                        ) : (
                          <span className="review-avatar-fallback">
                            {getInitial(userName)}
                          </span>
                        )}
                      </div>

                      <div className="review-user-info">
                        <strong>{userName}</strong>

                        {userEmail && <span>{userEmail}</span>}
                      </div>
                    </div>

                    <div className="review-top-right">
                      <span className={`review-status ${reviewStatus}`}>
                        {reviewStatus === "approved" && <Check size={11} />}

                        {reviewStatus === "rejected" && <X size={11} />}

                        {reviewStatus === "pending" && <Clock3 size={11} />}

                        {getStatusLabel(reviewStatus)}
                      </span>

                      {reviewDate && (
                        <span className="review-date">
                          <CalendarDays size={12} />

                          {formatDate(reviewDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* =====================================
                      PRODUCT
                  ===================================== */}

                  <div className="review-product">
                    <div className="review-product-image">
                      {productImage ? (
                        <>
                          <img
                            src={resolveMediaUrl(productImage)}
                            alt={productName}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.nextElementSibling;

                              if (fallback) {
                                fallback.hidden = false;
                              }
                            }}
                          />

                          <span className="review-product-fallback" hidden>
                            <Package size={20} />
                          </span>
                        </>
                      ) : (
                        <span className="review-product-fallback">
                          <Package size={20} />
                        </span>
                      )}
                    </div>

                    <div className="review-product-info">
                      <strong>{productName}</strong>

                      {review?.order?.orderNumber && (
                        <span>Order #{review.order.orderNumber}</span>
                      )}
                    </div>

                    <div className="review-product-rating">
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            size={14}
                            fill={
                              value <= reviewRating ? "currentColor" : "none"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      <span>
                        {reviewRating.toFixed(1)}
                        /5
                      </span>
                    </div>
                  </div>

                  {/* =====================================
                      REVIEW BODY
                  ===================================== */}

                  <div className="review-body">
                    <h3>{review?.title || "Customer Review"}</h3>

                    <p>{review?.comment || "No comment provided."}</p>
                  </div>

                  {/* =====================================
                      REJECTION REASON
                  ===================================== */}

                  {review?.rejectionReason && (
                    <div className="review-reason">
                      <div className="review-reason-icon">
                        <X size={13} />
                      </div>

                      <div>
                        <strong>Rejection reason</strong>

                        <span>{review.rejectionReason}</span>
                      </div>
                    </div>
                  )}

                  {/* =====================================
                      META
                  ===================================== */}

                  {reviewDate && (
                    <div className="review-meta">
                      <CalendarDays size={12} />

                      <span>Reviewed {formatDateTime(reviewDate)}</span>
                    </div>
                  )}

                  {/* =====================================
                      ACTIONS
                  ===================================== */}

                  <div className="review-actions">
                    {reviewStatus !== "approved" && (
                      <button
                        type="button"
                        className="review-action approve"
                        disabled={isBusy}
                        onClick={() => handleModerate(reviewId, "approved")}
                      >
                        <Check size={14} />

                        <span>Approve</span>
                      </button>
                    )}

                    {reviewStatus !== "rejected" && (
                      <button
                        type="button"
                        className="review-action reject"
                        disabled={isBusy}
                        onClick={() => handleModerate(reviewId, "rejected")}
                      >
                        <X size={14} />

                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="review-action delete"
                      disabled={isBusy}
                      onClick={() => handleDelete(reviewId)}
                    >
                      <Trash2 size={14} />

                      <span>Delete</span>
                    </button>
                  </div>

                  {/* =====================================
                      PROCESSING
                  ===================================== */}

                  {isBusy && (
                    <div className="review-processing">
                      <RefreshCw size={14} className="review-refresh-spin" />

                      <span>Processing...</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="admin-reviews-pagination">
            <div className="reviews-pagination-summary">
              Showing <strong>{getVisibleStart()}</strong>
              {" - "}
              <strong>{getVisibleEnd()}</strong> of{" "}
              <strong>{totalReviews}</strong> reviews
            </div>

            <div className="reviews-pagination-controls">
              <button
                type="button"
                className="pagination-arrow"
                disabled={loading || !pagination.hasPreviousPage}
                onClick={handlePreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="reviews-page-numbers">
                {pageNumbers.map((pageNumber) => {
                  if (typeof pageNumber === "string") {
                    return (
                      <span key={pageNumber} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={pageNumber}
                      className={`pagination-page ${
                        pageNumber === currentPage ? "active" : ""
                      }`}
                      disabled={loading}
                      onClick={() => handlePageClick(pageNumber)}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="pagination-arrow"
                disabled={loading || !pagination.hasNextPage}
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <form className="reviews-go-to" onSubmit={handleGoToPage}>
              <span>Go to page:</span>

              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPage}
                onChange={(event) => setGoToPage(event.target.value)}
                placeholder={String(currentPage)}
                aria-label="Go to page"
              />

              <button type="submit" disabled={loading || !goToPage}>
                Go
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminReviewsContent;
