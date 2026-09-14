import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import {
  getAllAdminOrders,
  updateAdminOrderStatus,
  cancelAdminOrder,
} from "../AdminApi";

import AdminOrderDetailsModal from "./AdminOrderDetailsModal";

import "../component/AdminPagination.css";
import "./AdminOrdersContent.css";

/* =========================================================
   ORDER STATUSES
========================================================= */

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];

/* =========================================================
   PAYMENT STATUSES
========================================================= */

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
];

/* =========================================================
   TERMINAL / TRANSITION HELPERS
========================================================= */

const getAllowedStatuses = (currentStatus) => {
  const normalizedStatus = String(currentStatus || "pending")
    .trim()
    .toLowerCase();

  /*
   * Once delivered, only return/refund
   * operations are meaningful.
   */
  if (normalizedStatus === "delivered") {
    return ["delivered", "returned", "refunded"];
  }

  /*
   * Cancelled orders can only move
   * to refunded.
   */
  if (normalizedStatus === "cancelled") {
    return ["cancelled", "refunded"];
  }

  /*
   * Returned orders can move to refunded.
   */
  if (normalizedStatus === "returned") {
    return ["returned", "refunded"];
  }

  /*
   * Refunded is effectively final.
   */
  if (normalizedStatus === "refunded") {
    return ["refunded"];
  }

  return ORDER_STATUSES;
};

/* =========================================================
   FORMAT STATUS
========================================================= */

const formatStatus = (value = "") => {
  if (!value) {
    return "Pending";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   FORMAT CURRENCY
========================================================= */

const formatCurrency = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "₹0";
  }

  return `₹${numericAmount.toLocaleString("en-IN")}`;
};

/* =========================================================
   COMPONENT
========================================================= */

const AdminOrdersContent = () => {
  /* =======================================================
     STATE
  ======================================================= */

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("search") || "";
  });

  const [status, setStatus] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({});

  const [busy, setBusy] = useState(null);

  const [selected, setSelected] = useState(null);

  /* =======================================================
     FETCH ORDERS
  ======================================================= */

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      if (status) {
        params.status = status;
      }

      if (paymentStatus) {
        params.paymentStatus = paymentStatus;
      }

      const response = await getAllAdminOrders(params);

      const responseData = response?.data?.data;

      let orderList = [];

      if (Array.isArray(responseData)) {
        orderList = responseData;
      } else if (Array.isArray(responseData?.orders)) {
        orderList = responseData.orders;
      }

      setOrders(orderList);

      setPagination(response?.data?.pagination || {});
    } catch (err) {
      console.error("Admin orders fetch error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load orders.",
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, paymentStatus]);

  /* =======================================================
     FETCH WHEN FILTERS / PAGE CHANGE
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchOrders]);

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const handleResetFilters = () => {
    if (!search.trim() && !status && !paymentStatus && page === 1) {
      return;
    }

    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setPage(1);
  };

  /* =======================================================
     ACTION HANDLER
  ======================================================= */

  const handleAction = async (orderId, actionFn) => {
    if (!orderId || busy) {
      return;
    }

    try {
      setBusy(orderId);
      setError("");

      await actionFn();

      await fetchOrders();
    } catch (err) {
      console.error("Admin order action error:", err);

      alert(err?.response?.data?.message || err?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  /* =======================================================
     STATUS CHANGE
  ======================================================= */

  const handleStatusChange = (order, nextStatus) => {
    if (!order?._id || !nextStatus) {
      return;
    }

    const currentStatus = order.orderStatus || "pending";

    if (currentStatus === nextStatus) {
      return;
    }

    const allowedStatuses = getAllowedStatuses(currentStatus);

    if (!allowedStatuses.includes(nextStatus)) {
      alert(
        `Order cannot move from ${formatStatus(
          currentStatus,
        )} to ${formatStatus(nextStatus)}.`,
      );

      return;
    }

    handleAction(order._id, () =>
      updateAdminOrderStatus(order._id, nextStatus),
    );
  };

  /* =======================================================
     CANCEL ORDER
  ======================================================= */

  const handleCancelOrder = (order) => {
    if (!order?._id) {
      return;
    }

    const orderLabel = order.orderNumber ? `#${order.orderNumber}` : "";

    const confirmed = window.confirm(
      `Are you sure you want to cancel order ${orderLabel}?`,
    );

    if (!confirmed) {
      return;
    }

    handleAction(order._id, () =>
      cancelAdminOrder(order._id, {
        cancellationReason: "Cancelled by administrator",
      }),
    );
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearchChange = (event) => {
    setPage(1);
    setSearch(event.target.value);
  };

  /* =======================================================
     ORDER STATUS FILTER
  ======================================================= */

  const handleStatusFilter = (event) => {
    setPage(1);
    setStatus(event.target.value);
  };

  /* =======================================================
     PAYMENT FILTER
  ======================================================= */

  const handlePaymentFilter = (event) => {
    setPage(1);
    setPaymentStatus(event.target.value);
  };

  /* =======================================================
     PREVIOUS PAGE
  ======================================================= */

  const handlePreviousPage = () => {
    if (page <= 1 || pagination?.hasPreviousPage === false) {
      return;
    }

    setPage((currentPage) => currentPage - 1);
  };

  /* =======================================================
     NEXT PAGE
  ======================================================= */

  const handleNextPage = () => {
    if (pagination?.hasNextPage === false) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  };

  /* =======================================================
     PAGINATION VALUES
  ======================================================= */

  const currentPage = Number(pagination?.currentPage) || page;

  const totalPages = Number(pagination?.totalPages) || 1;

  const totalOrders =
    pagination?.totalOrders ?? pagination?.total ?? orders.length;

  const hasPreviousPage =
    pagination?.hasPreviousPage !== undefined
      ? pagination.hasPreviousPage
      : currentPage > 1;

  const hasNextPage =
    pagination?.hasNextPage !== undefined
      ? pagination.hasNextPage
      : currentPage < totalPages;

  const hasActiveFilters = Boolean(search.trim() || status || paymentStatus);

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders-state">
        <div className="admin-orders-loading-content">
          <div className="admin-orders-loader" />

          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  /* =======================================================
     INITIAL ERROR
  ======================================================= */

  if (error && orders.length === 0) {
    return (
      <div className="admin-orders-state error">
        <div className="admin-orders-error-content">
          <strong>Unable to load orders</strong>

          <span>{error}</span>

          <button type="button" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="admin-orders-content">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-orders-page-header">
        <div>
          <h1>Orders Catalog</h1>

          <p>Manage and track all customer orders.</p>
        </div>

        <div
          className="admin-orders-total"
          aria-label={`${totalOrders} total orders`}
        >
          <ShoppingBag size={19} />

          <span>
            {totalOrders} {Number(totalOrders) === 1 ? "Order" : "Orders"}
          </span>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="admin-orders-filters">
        {/* SEARCH */}

        <div className="admin-orders-search">
          <Search size={19} aria-hidden="true" />

          <input
            type="search"
            placeholder="Search by order number..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search orders"
          />
        </div>

        {/* ORDER STATUS */}

        <select
          value={status}
          onChange={handleStatusFilter}
          aria-label="Filter by order status"
        >
          <option value="">All Status</option>

          {ORDER_STATUSES.map((orderStatus) => (
            <option key={orderStatus} value={orderStatus}>
              {formatStatus(orderStatus)}
            </option>
          ))}
        </select>

        {/* PAYMENT */}

        <select
          value={paymentStatus}
          onChange={handlePaymentFilter}
          aria-label="Filter by payment status"
        >
          <option value="">All Payments</option>

          {PAYMENT_STATUSES.map((payment) => (
            <option key={payment} value={payment}>
              {formatStatus(payment)}
            </option>
          ))}
        </select>

        {/* RESET */}

        <button
          type="button"
          className="admin-orders-reset"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters && page === 1}
          title="Reset all filters"
        >
          <RotateCcw size={16} />

          <span>Reset Filters</span>
        </button>
      </div>

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="admin-orders-table-card">
        {/* TABLE */}

        <div className="admin-orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order Details</th>

                <th>Customer</th>

                <th>Date</th>

                <th>Amount</th>

                <th>Payment</th>

                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-orders-empty">
                    <div className="admin-orders-empty-content">
                      <ShoppingBag size={30} />

                      <strong>No orders found</strong>

                      <span>Try changing your search or filters.</span>

                      {hasActiveFilters && (
                        <button type="button" onClick={handleResetFilters}>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  if (!order?._id) {
                    return null;
                  }

                  const orderId = order._id;

                  const orderStatus = order.orderStatus || "pending";

                  const paymentStatus = order.paymentStatus || "pending";

                  const itemCount = Array.isArray(order.items)
                    ? order.items.length
                    : Number(order.itemsCount) || 0;

                  const allowedStatuses = getAllowedStatuses(orderStatus);

                  const canCancel = [
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "out_for_delivery",
                  ].includes(orderStatus);

                  const isBusy = busy === orderId;

                  return (
                    <tr key={orderId}>
                      {/* =================================
                          ORDER DETAILS
                      ================================= */}

                      <td>
                        <div className="admin-order-number">
                          <strong>#{order.orderNumber || orderId}</strong>

                          <span>
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </td>

                      {/* =================================
                          CUSTOMER
                      ================================= */}

                      <td>
                        <div className="admin-order-customer">
                          <strong>{order.user?.name || "Unknown User"}</strong>

                          <span title={order.user?.email || ""}>
                            {order.user?.email || "—"}
                          </span>
                        </div>
                      </td>

                      {/* =================================
                          DATE
                      ================================= */}

                      <td>
                        <span className="admin-order-date">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      {/* =================================
                          AMOUNT
                      ================================= */}

                      <td>
                        <strong className="admin-order-amount">
                          {formatCurrency(order.totalAmount)}
                        </strong>
                      </td>

                      {/* =================================
                          PAYMENT
                      ================================= */}

                      <td>
                        <span className={`payment-status ${paymentStatus}`}>
                          <span className="status-dot" />

                          {formatStatus(paymentStatus)}
                        </span>
                      </td>

                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>
                        <select
                          className={`order-status-select ${orderStatus}`}
                          value={orderStatus}
                          disabled={isBusy}
                          onChange={(event) =>
                            handleStatusChange(order, event.target.value)
                          }
                          aria-label={`Change status for ${
                            order.orderNumber || orderId
                          }`}
                        >
                          {ORDER_STATUSES.map((statusOption) => {
                            const isAllowed =
                              allowedStatuses.includes(statusOption);

                            return (
                              <option
                                key={statusOption}
                                value={statusOption}
                                disabled={!isAllowed}
                              >
                                {formatStatus(statusOption)}
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      {/* =================================
                          ACTIONS
                      ================================= */}

                      <td>
                        <div className="admin-order-actions">
                          {/* VIEW */}

                          <button
                            type="button"
                            className="order-action view"
                            title="View Order"
                            aria-label={`View order ${
                              order.orderNumber || orderId
                            }`}
                            onClick={() => setSelected(orderId)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* CANCEL */}

                          {canCancel && (
                            <button
                              type="button"
                              className="order-action cancel"
                              title="Cancel Order"
                              aria-label={`Cancel order ${
                                order.orderNumber || orderId
                              }`}
                              disabled={isBusy}
                              onClick={() => handleCancelOrder(order)}
                            >
                              <XCircle size={16} />
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

        <div className="admin-pagination">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={handlePreviousPage}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />

            <span>Previous</span>
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={handleNextPage}
            aria-label="Next page"
          >
            <span>Next</span>

            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* =================================================
          REFRESHING
      ================================================= */}

      {loading && orders.length > 0 && (
        <div className="admin-orders-refreshing">Updating orders...</div>
      )}

      {/* =================================================
          MODAL
      ================================================= */}

      {selected && (
        <AdminOrderDetailsModal
          orderId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default AdminOrdersContent;
