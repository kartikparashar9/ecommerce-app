import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserX,
  AlertCircle,
} from "lucide-react";

import {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
} from "../AdminApi";

import { resolveMediaUrl, getInitial } from "../../utils/media";
import "./AdminUsersContent.css";

// Helper Avatar Component with smooth React fallback state
const UserAvatar = ({ src, name }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const avatarUrl = src ? resolveMediaUrl(src) : "";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || "User"}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  return <span>{getInitial(name || "User")}</span>;
};

const AdminUsersContent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(() => {
    return new URLSearchParams(window.location.search).get("search") || "";
  });

  const [role, setRole] = useState("");
  const [blocked, setBlocked] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [busy, setBusy] = useState(null);

  const hasActiveFilters = Boolean(search.trim() || role || blocked !== "");

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (role) {
        params.role = role;
      }

      if (blocked !== "") {
        params.isBlocked = blocked;
      }

      const response = await getAllUsers(params);
      const responseData = response?.data?.data;

      let userList = [];
      let paginationData = {};

      if (Array.isArray(responseData)) {
        userList = responseData;
      } else if (responseData && typeof responseData === "object") {
        userList = Array.isArray(responseData.users) ? responseData.users : [];
        paginationData = responseData.pagination || {};
      }

      setUsers(userList);

      setPagination({
        currentPage: paginationData.currentPage ?? page,
        totalPages: paginationData.totalPages ?? 1,
        totalUsers:
          paginationData.totalUsers ??
          paginationData.total ??
          userList.length,
        hasPreviousPage: paginationData.hasPreviousPage ?? page > 1,
        hasNextPage: paginationData.hasNextPage ?? false,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load users. Please check your connection and retry."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, blocked]);

  // =========================================================
  // DEBOUNCE EFFECT FOR FETCHING
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  // =========================================================
  // ACTIONS (BLOCK / UNBLOCK / DELETE)
  // =========================================================

  const handleAction = async (id, action) => {
    if (!id || busy === id) return;

    try {
      setBusy(id);
      setError("");

      await action();
      await loadUsers();
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

  // =========================================================
  // FILTER HANDLERS
  // =========================================================

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    if (page !== 1) setPage(1);
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleBlockedChange = (event) => {
    setBlocked(event.target.value);
    if (page !== 1) setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setRole("");
    setBlocked("");
    if (page !== 1) setPage(1);
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDelete = (user) => {
    if (!user?._id || user.role === "admin") return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name || "this user"}" and all related data? This action cannot be undone.`
    );

    if (!confirmed) return;

    handleAction(user._id, () => deleteUser(user._id));
  };

  // =========================================================
  // INITIAL FULL PAGE LOADING STATE
  // =========================================================

  if (loading && users.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-users-state">
        <div className="admin-users-loader">
          <Loader2 size={36} className="admin-spinner" />
          <p>Loading users database...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // INITIAL ERROR STATE
  // =========================================================

  if (error && users.length === 0 && !hasActiveFilters && page === 1) {
    return (
      <div className="admin-users-state error">
        <div className="admin-users-error-card">
          <AlertCircle size={40} />
          <h3>Failed to Load Users</h3>
          <p>{error}</p>
          <button
            type="button"
            className="admin-retry-btn"
            onClick={loadUsers}
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER UI
  // =========================================================

  return (
    <div className="admin-users-content">
      {/* HEADER */}
      <div className="admin-users-page-header">
        <div className="admin-header-title">
          <h1>Users Management</h1>
          <p>Manage customer access, seller permissions, and user accounts.</p>
        </div>

        <div className="admin-users-total">
          <Users size={18} />
          <span>
            <strong>{pagination.totalUsers}</strong> Total Users
          </span>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="admin-users-filters-bar">
        <div className="admin-users-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search users"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="admin-users-filter-group">
          {/* Role Filter */}
          <select
            value={role}
            onChange={handleRoleChange}
            aria-label="Filter users by role"
            className="admin-select"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>

          {/* Access Filter */}
          <select
            value={blocked}
            onChange={handleBlockedChange}
            aria-label="Filter users by access status"
            className="admin-select"
          >
            <option value="">All Access Status</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          {/* Reset Filters */}
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

      {/* INLINE ERROR BANNER */}
      {error && (
        <div className="admin-users-inline-error">
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

      {/* TABLE CARD */}
      <div className="admin-users-table-card">
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="admin-skeleton-row">
                    <td>
                      <div className="admin-user-info">
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
              ) : users.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5} className="admin-users-empty">
                    <div className="empty-state-content">
                      <UserX size={44} className="empty-icon" />
                      <h3>No users found</h3>
                      <p>
                        {hasActiveFilters
                          ? "No users match your current filter criteria. Try adjusting your search or filters."
                          : "There are currently no users registered in the system."}
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
                // Users list
                users.map((user) => {
                  const userId = user?._id;
                  const isAdmin = user?.role === "admin";
                  const isBusy = busy === userId;
                  const userRole = (user?.role || "user").toLowerCase();

                  return (
                    <tr key={userId} className={isBusy ? "row-busy" : ""}>
                      {/* USER DETAILS */}
                      <td>
                        <div className="admin-user-info">
                          <div className="admin-user-avatar">
                            <UserAvatar src={user?.avatar} name={user?.name} />
                          </div>

                          <div className="admin-user-details">
                            <strong className="user-name">
                              {user?.name || "Unknown User"}
                            </strong>
                            <span className="user-email">
                              {user?.email || "No email provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PHONE */}
                      <td>
                        <span className="user-phone">
                          {user?.phone || "-"}
                        </span>
                      </td>

                      {/* ROLE */}
                      <td>
                        <span className={`admin-role-badge ${userRole}`}>
                          {user?.role || "user"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`admin-status-badge ${
                            user?.isBlocked ? "blocked" : "active"
                          }`}
                        >
                          <span className="status-indicator-dot" />
                          {user?.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="text-right">
                        <div className="admin-user-actions">
                          {/* BLOCK / UNBLOCK */}
                          {user?.isBlocked ? (
                            <button
                              type="button"
                              className="admin-user-action-btn unblock"
                              disabled={isBusy}
                              onClick={() =>
                                handleAction(userId, () => unblockUser(userId))
                              }
                              title="Unblock user account"
                              aria-label={`Unblock ${user?.name || "user"}`}
                            >
                              {isBusy ? (
                                <Loader2 size={15} className="admin-btn-spinner" />
                              ) : (
                                <>
                                  <ShieldCheck size={16} />
                                  <span>Unblock</span>
                                </>
                              )}
                            </button>
                          ) : (
                            !isAdmin && (
                              <button
                                type="button"
                                className="admin-user-icon-btn block"
                                disabled={isBusy}
                                onClick={() =>
                                  handleAction(userId, () => blockUser(userId))
                                }
                                title="Block user account"
                                aria-label={`Block ${user?.name || "user"}`}
                              >
                                {isBusy ? (
                                  <Loader2 size={16} className="admin-btn-spinner" />
                                ) : (
                                  <ShieldOff size={16} />
                                )}
                              </button>
                            )
                          )}

                          {/* DELETE */}
                          {!isAdmin && (
                            <button
                              type="button"
                              className="admin-user-icon-btn delete"
                              disabled={isBusy}
                              onClick={() => handleDelete(user)}
                              title="Delete user account"
                              aria-label={`Delete ${user?.name || "user"}`}
                            >
                              {isBusy ? (
                                <Loader2 size={16} className="admin-btn-spinner" />
                              ) : (
                                <Trash2 size={16} />
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

        {/* PAGINATION */}
        {users.length > 0 && (
          <div className="admin-users-pagination">
            <div className="admin-pagination-info">
              Showing page <strong>{pagination.currentPage || page}</strong> of{" "}
              <strong>{pagination.totalPages || 1}</strong>
            </div>

            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-pagination-btn"
                disabled={loading || !pagination.hasPreviousPage}
                onClick={() => setPage((cp) => Math.max(1, cp - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="admin-pagination-btn"
                disabled={loading || !pagination.hasNextPage}
                onClick={() =>
                  setPage((cp) =>
                    Math.min(pagination.totalPages || cp + 1, cp + 1)
                  )
                }
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

export default AdminUsersContent;