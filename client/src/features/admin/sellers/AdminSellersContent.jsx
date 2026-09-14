import React, { useCallback, useEffect, useState } from "react";

import {
  Search,
  Store,
  Check,
  X,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import {
  getAllSellers,
  approveSeller,
  rejectSeller,
  activateSeller,
  deactivateSeller,
  blockSeller,
  unblockSeller,
} from "../AdminApi";

import { resolveMediaUrl, getInitial } from "../../utils/media";

import "./AdminSellersContent.css";

// =========================================================
// SELLER AVATAR
// =========================================================

const SellerAvatar = ({ user }) => {
  const [imageError, setImageError] = useState(false);

  const name = user?.name?.trim() || "Seller";

  const avatar = user?.avatar;

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  if (!avatar || imageError) {
    return (
      <div className="admin-seller-avatar admin-seller-avatar-fallback">
        {avatar ? <span>{getInitial(name, "S")}</span> : <Store size={18} />}
      </div>
    );
  }

  return (
    <div className="admin-seller-avatar">
      <img
        src={resolveMediaUrl(avatar)}
        alt={name}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const AdminSellersContent = () => {
  // =======================================================
  // STATE
  // =======================================================

  const [sellers, setSellers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("search") || "",
  );

  // This UI state represents verification status.
  // Backend endpoint expects this value as `status`.
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [busy, setBusy] = useState(null);

  const hasActiveFilters = Boolean(search.trim() || status);

  // =======================================================
  // FETCH SELLERS
  // =======================================================

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      // Search
      if (search.trim()) {
        params.search = search.trim();
      }
      if (status) {
        params.status = status;
      }

      const response = await getAllSellers(params);

      const responseData = response?.data?.data;

      let sellerList = [];
      let paginationData = {};

      // ---------------------------------------------------
      // API RESPONSE: ARRAY
      // ---------------------------------------------------

      if (Array.isArray(responseData)) {
        sellerList = responseData;
      }

      // ---------------------------------------------------
      // API RESPONSE: OBJECT
      // ---------------------------------------------------
      else if (responseData && typeof responseData === "object") {
        sellerList = Array.isArray(responseData.sellers)
          ? responseData.sellers
          : [];

        paginationData = responseData.pagination || {};
      }

      setSellers(sellerList);

      setPagination({
        page: paginationData.page ?? page,

        limit: paginationData.limit ?? 10,

        total: paginationData.total ?? sellerList.length,

        totalPages: paginationData.totalPages ?? 1,

        hasNextPage: Boolean(paginationData.hasNextPage ?? false),

        hasPreviousPage: Boolean(paginationData.hasPreviousPage ?? page > 1),
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load sellers database. Please check your connection.";

      setError(message);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // =======================================================
  // FETCH WHEN FILTERS CHANGE
  // =======================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellers();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchSellers]);

  // =======================================================
  // GENERIC ACTION HANDLER
  // =======================================================

  const handleAction = async (sellerId, action) => {
    if (!sellerId || !action || busy === sellerId) {
      return;
    }

    try {
      setBusy(sellerId);
      setError("");

      await action();

      await fetchSellers();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Action failed. Please try again.";

      setError(message);
    } finally {
      setBusy(null);
    }
  };

  // =======================================================
  // APPROVE
  // =======================================================

  const handleApprove = (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this seller application?",
    );

    if (!confirmed) {
      return;
    }

    handleAction(sellerId, () => approveSeller(sellerId));
  };

  // =======================================================
  // REJECT
  // =======================================================

  const handleReject = (sellerId) => {
    const reason = window.prompt("Enter rejection reason for this seller:");

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      alert("Rejection reason is required.");
      return;
    }

    handleAction(sellerId, () =>
      rejectSeller(sellerId, {
        rejectionReason: trimmedReason,
      }),
    );
  };

  // =======================================================
  // BLOCK
  // =======================================================

  const handleBlock = (sellerId) => {
    const reason = window.prompt("Enter reason for blocking this seller:");

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      alert("Block reason is required.");
      return;
    }

    handleAction(sellerId, () => blockSeller(sellerId, trimmedReason));
  };

  // =======================================================
  // UNBLOCK
  // =======================================================

  const handleUnblock = (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to unblock this seller?",
    );

    if (!confirmed) {
      return;
    }

    handleAction(sellerId, () => unblockSeller(sellerId));
  };

  // =======================================================
  // ACTIVATE
  // =======================================================

  const handleActivate = (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to activate this seller account?",
    );

    if (!confirmed) {
      return;
    }

    handleAction(sellerId, () => activateSeller(sellerId));
  };

  // =======================================================
  // DEACTIVATE
  // =======================================================

  const handleDeactivate = (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this seller account?",
    );

    if (!confirmed) {
      return;
    }

    handleAction(sellerId, () => deactivateSeller(sellerId));
  };

  // =======================================================
  // SEARCH
  // =======================================================

  const handleSearchChange = (event) => {
    setSearch(event.target.value);

    if (page !== 1) {
      setPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearch("");

    if (page !== 1) {
      setPage(1);
    }
  };

  // =======================================================
  // STATUS FILTER
  // =======================================================

  const handleStatusChange = (event) => {
    setStatus(event.target.value);

    if (page !== 1) {
      setPage(1);
    }
  };

  // =======================================================
  // RESET FILTERS
  // =======================================================

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");

    if (page !== 1) {
      setPage(1);
    }
  };

  // =======================================================
  // PAGINATION
  // =======================================================

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setPage((currentPage) => Math.max(1, currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  // =======================================================
  // INITIAL LOADING
  // =======================================================

  if (loading && sellers.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-sellers-state">
        <div className="admin-sellers-loader-card">
          <Loader2 className="admin-spinner" size={36} />

          <span>Loading sellers database...</span>
        </div>
      </div>
    );
  }

  // =======================================================
  // INITIAL ERROR
  // =======================================================

  if (error && sellers.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-sellers-state error">
        <div className="admin-sellers-error-card">
          <AlertCircle size={40} />

          <h3>Failed to Load Sellers</h3>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchSellers}
            className="admin-sellers-retry-btn"
          >
            <RotateCcw size={16} />

            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="admin-sellers-content">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="admin-sellers-page-header">
        <div className="admin-header-title">
          <h1>Sellers Management</h1>

          <p>
            Review seller applications, manage accounts, and monitor access.
          </p>
        </div>

        <div className="admin-sellers-total">
          <Store size={18} />

          <span>
            <strong>{pagination.total ?? sellers.length}</strong> Total Sellers
          </span>
        </div>
      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="admin-sellers-filters-bar">
        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (page !== 1) {
              setPage(1);
            }

            fetchSellers();
          }}
          className="admin-sellers-search"
        >
          <Search size={18} className="search-icon" />

          <input
            type="text"
            placeholder="Search seller name, business, or email..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search sellers"
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <div className="admin-sellers-filter-group">
          <select
            value={status}
            onChange={handleStatusChange}
            aria-label="Filter sellers by verification status"
            className="admin-select"
          >
            <option value="">All Verification Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="admin-reset-filters-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />

              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="admin-sellers-inline-error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            className="close-error-btn"
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="admin-sellers-table-card">
        <div className="admin-sellers-table-wrapper">
          <table className="admin-sellers-table">
            <thead>
              <tr>
                <th>Seller Details</th>

                <th>Business Info</th>

                <th>Verification</th>

                <th>Account Status</th>

                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* ==========================================
                  LOADING
              ========================================== */}

              {loading ? (
                Array.from({
                  length: 5,
                }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="admin-skeleton-row">
                    <td>
                      <div className="admin-seller-info">
                        <div className="skeleton skeleton-avatar" />

                        <div className="skeleton-text-group">
                          <div className="skeleton skeleton-line short" />
                          <div className="skeleton skeleton-line long" />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="skeleton skeleton-line medium" />
                    </td>

                    <td>
                      <div className="skeleton skeleton-badge" />
                    </td>

                    <td>
                      <div className="skeleton skeleton-badge" />
                    </td>

                    <td className="text-right">
                      <div className="skeleton skeleton-actions" />
                    </td>
                  </tr>
                ))
              ) : sellers.length === 0 ? (
                /* ========================================
                    EMPTY
                ======================================== */

                <tr>
                  <td colSpan="5" className="admin-sellers-empty">
                    <div className="empty-state-content">
                      <Store size={44} className="empty-icon" />

                      <h3>No sellers found</h3>

                      <p>
                        {hasActiveFilters
                          ? "No sellers match your current search or status filter. Try clearing your search parameters."
                          : "There are currently no seller accounts in the system."}
                      </p>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="admin-reset-filters-btn secondary"
                          onClick={handleResetFilters}
                        >
                          <RotateCcw size={14} />

                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                /* ========================================
                    SELLERS
                ======================================== */

                sellers.map((seller) => {
                  if (!seller?._id) {
                    return null;
                  }

                  const user =
                    seller.user && typeof seller.user === "object"
                      ? seller.user
                      : null;

                  const isBusy = busy === seller._id;

                  const verificationStatus =
                    seller.verificationStatus || "pending";

                  const isBlocked = Boolean(seller.isBlocked);

                  const isActive = Boolean(seller.isActive);

                  return (
                    <tr key={seller._id} className={isBusy ? "row-busy" : ""}>
                      {/* =================================
                            SELLER DETAILS
                        ================================= */}

                      <td>
                        <div className="admin-seller-info">
                          <SellerAvatar user={user} />

                          <div className="admin-seller-details">
                            <strong className="seller-name">
                              {user?.name?.trim() || "Unknown Seller"}
                            </strong>

                            <span className="seller-email">
                              {user?.email || "No email provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* =================================
                            BUSINESS
                        ================================= */}

                      <td>
                        <div className="admin-business-info">
                          <strong className="business-title">
                            {seller.businessName || "-"}
                          </strong>

                          {seller.businessType && (
                            <span className="business-type">
                              {seller.businessType
                                .replaceAll("_", " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase())}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* =================================
                            VERIFICATION
                        ================================= */}

                      <td>
                        <span
                          className={`seller-verification ${verificationStatus}`}
                        >
                          {verificationStatus
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                        </span>
                      </td>

                      {/* =================================
                            ACCOUNT STATUS
                        ================================= */}

                      <td>
                        <span
                          className={`seller-status ${
                            isBlocked
                              ? "blocked"
                              : isActive
                                ? "active"
                                : "inactive"
                          }`}
                        >
                          <span className="status-indicator-dot" />

                          {isBlocked
                            ? "Blocked"
                            : isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </td>

                      {/* =================================
                            ACTIONS
                        ================================= */}

                      <td className="text-right">
                        <div className="admin-seller-actions">
                          {/* =================================
                                PENDING
                            ================================= */}

                          {verificationStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleApprove(seller._id)}
                                title="Approve seller application"
                                aria-label="Approve seller"
                                className="seller-action approve"
                              >
                                {isBusy ? (
                                  <Loader2
                                    size={16}
                                    className="admin-btn-spinner"
                                  />
                                ) : (
                                  <Check size={16} />
                                )}
                              </button>
                            </>
                          )}

                          {/* =================================
                                APPROVED
                            ================================= */}

                          {verificationStatus === "approved" &&
                            !isBlocked &&
                            (isActive ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeactivate(seller._id)}
                                title="Deactivate seller"
                                aria-label="Deactivate seller"
                                className="seller-action deactivate"
                              >
                                {isBusy ? (
                                  <Loader2
                                    size={16}
                                    className="admin-btn-spinner"
                                  />
                                ) : (
                                  <XCircle size={16} />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleActivate(seller._id)}
                                title="Activate seller"
                                aria-label="Activate seller"
                                className="seller-action activate"
                              >
                                {isBusy ? (
                                  <Loader2
                                    size={16}
                                    className="admin-btn-spinner"
                                  />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                            ))}

                          {/* =================================
                                BLOCK / UNBLOCK
                            ================================= */}

                          {isBlocked ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUnblock(seller._id)}
                              title="Unblock seller"
                              aria-label="Unblock seller"
                              className="seller-action unblock"
                            >
                              {isBusy ? (
                                <Loader2
                                  size={16}
                                  className="admin-btn-spinner"
                                />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleBlock(seller._id)}
                              title="Block seller"
                              aria-label="Block seller"
                              className="seller-action block"
                            >
                              {isBusy ? (
                                <Loader2
                                  size={16}
                                  className="admin-btn-spinner"
                                />
                              ) : (
                                <Ban size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {sellers.length > 0 && (
          <div className="admin-sellers-pagination">
            <div className="admin-pagination-info">
              Showing page <strong>{pagination.page || page}</strong> of{" "}
              <strong>{pagination.totalPages || 1}</strong>
            </div>

            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={handlePreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />

                <span>Previous</span>
              </button>

              <button
                type="button"
                className="admin-pagination-btn"
                disabled={!pagination.hasNextPage || loading}
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <span>Next</span>

                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSellersContent;
