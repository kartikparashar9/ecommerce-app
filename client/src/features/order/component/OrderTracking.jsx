import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchOrderById,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
} from "../../order/OrderSlice";

import "./OrderTracking.css";

// =====================================================
// STATUS FLOW
// =====================================================

const TRACKING_STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    description: "Your order has been placed successfully.",
    icon: Clock3,
  },
  {
    key: "processing",
    label: "Processing",
    description: "Your order is being prepared.",
    icon: Package,
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "Your order has been handed over for delivery.",
    icon: Truck,
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    description: "Your order is on the way to you.",
    icon: MapPin,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
    icon: CheckCircle2,
  },
];

const STATUS_INDEX = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
};

// =====================================================
// HELPERS
// =====================================================

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

// =====================================================
// COMPONENT
// =====================================================

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const order = useSelector(selectCurrentOrder);
  const orderLoading = useSelector(selectOrderLoading);
  const orderError = useSelector(selectOrderError);

  const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [shippingError, setShippingError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // LOAD SHIPPING
  // =====================================================

  const loadShipping = useCallback(async () => {
    if (!orderId) {
      setShippingLoading(false);
      return;
    }

    try {
      setShippingLoading(true);
      setShippingError("");

      const result = await getShippingByOrderApi(orderId);

      setShipping(result?.data || result || null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load shipping information.";

      setShipping(null);
      setShippingError(message);
    } finally {
      setShippingLoading(false);
    }
  }, [orderId]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!orderId) return;

    dispatch(fetchOrderById(orderId));
    loadShipping();
  }, [dispatch, orderId, loadShipping]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    if (!orderId) return;

    try {
      setRefreshing(true);

      await Promise.all([dispatch(fetchOrderById(orderId)), loadShipping()]);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // CURRENT STATUS
  // =====================================================

  const currentStatus = useMemo(() => {
    const shippingStatus = shipping?.status?.toLowerCase();

    if (shippingStatus) {
      return shippingStatus;
    }

    const orderStatus = order?.orderStatus?.toLowerCase();

    if (orderStatus === "confirmed") {
      return "pending";
    }

    return orderStatus || "pending";
  }, [shipping, order]);

  const isCancelled =
    currentStatus === "cancelled" || order?.orderStatus === "cancelled";

  const isReturned =
    currentStatus === "returned" || order?.orderStatus === "returned";

  const currentIndex = STATUS_INDEX[currentStatus] ?? 0;

  // =====================================================
  // LOADING
  // =====================================================

  if (orderLoading && !order) {
    return (
      <section className="order-tracking-page">
        <div className="tracking-loading">
          <RefreshCw className="tracking-spin" size={24} />
          <p>Loading order details...</p>
        </div>
      </section>
    );
  }

  // =====================================================
  // ORDER ERROR
  // =====================================================

  if (orderError && !order) {
    return (
      <section className="order-tracking-page">
        <div className="tracking-error">
          <XCircle size={42} />
          <h2>Order not found</h2>
          <p>{orderError}</p>

          <Link to="/orders" className="tracking-primary-btn">
            <ArrowLeft size={18} />
            Back to Orders
          </Link>
        </div>
      </section>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <section className="order-tracking-page">
      {/* HEADER */}

      <div className="tracking-topbar">
        <Link to="/orders" className="tracking-back">
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <button
          type="button"
          className="tracking-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? "tracking-spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ORDER SUMMARY */}

      <div className="tracking-card tracking-order-card">
        <div>
          <span className="tracking-label">Order Number</span>

          <h1>#{order?.orderNumber || order?._id || orderId}</h1>
        </div>

        <div className="tracking-order-summary">
          <div>
            <span className="tracking-label">Order Date</span>

            <strong>{formatDate(order?.createdAt)}</strong>
          </div>

          <div>
            <span className="tracking-label">Total</span>

            <strong>{formatAmount(order?.totalAmount)}</strong>
          </div>
        </div>
      </div>

      {/* CANCELLED */}

      {isCancelled && (
        <div className="tracking-card tracking-danger-card">
          <XCircle size={30} />

          <div>
            <h3>Order Cancelled</h3>
            <p>
              This order has been cancelled and will not continue through
              delivery.
            </p>
          </div>
        </div>
      )}

      {/* RETURNED */}

      {isReturned && (
        <div className="tracking-card tracking-warning-card">
          <RotateCcw size={30} />

          <div>
            <h3>Order Returned</h3>
            <p>This order has been marked as returned.</p>
          </div>
        </div>
      )}

      {/* TRACKING */}

      {!isCancelled && !isReturned && (
        <div className="tracking-card">
          <div className="tracking-card-header">
            <div>
              <span className="tracking-label">Delivery Status</span>

              <h2>{TRACKING_STEPS[currentIndex]?.label || "Order Placed"}</h2>
            </div>

            {shipping?.status && (
              <span className="tracking-status-badge">
                {shipping.status
                  .replaceAll("_", " ")
                  .replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </span>
            )}
          </div>

          <div className="tracking-timeline">
            {TRACKING_STEPS.map((step, index) => {
              const Icon = step.icon;

              const isDone = index < currentIndex;
              const isActive = index === currentIndex;

              return (
                <div
                  key={step.key}
                  className={[
                    "tracking-step",
                    isDone ? "is-done" : "",
                    isActive ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="tracking-step-marker">
                    <Icon size={20} />
                  </div>

                  <div className="tracking-step-content">
                    <h3>{step.label}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default OrderTrackingPage;
