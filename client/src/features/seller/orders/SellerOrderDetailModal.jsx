import React, { useEffect, useState } from "react";
import {
  FiX,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getSellerOrderByIdApi,
  updateSellerOrderStatusApi,
} from "../sellerApi";
import "./SellerOrderDetailModal.css";

const SellerOrderDetailModal = ({ orderId, onClose, onUpdated }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSellerOrderByIdApi(orderId);

        const data =
          response?.data?.order ||
          response?.data ||
          response?.order ||
          response;

        setOrder(data || null);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load order details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !updating) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, updating]);

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      shipped: "out_for_delivery",
      out_for_delivery: "delivered",
    };

    return flow[currentStatus];
  };

  const getStatusLabel = (status = "") => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock />;

      case "confirmed":
        return <FiCheckCircle />;

      case "processing":
        return <FiPackage />;

      case "shipped":
      case "out_for_delivery":
        return <FiTruck />;

      case "delivered":
        return <FiCheckCircle />;

      default:
        return <FiPackage />;
    }
  };

  const handleUpdateStatus = async () => {
    if (!order?._id) return;

    const nextStatus = getNextStatus(order.orderStatus);

    if (!nextStatus) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await updateSellerOrderStatusApi(order._id, nextStatus);

      const updatedOrder =
        response?.data?.order || response?.data || response?.order;

      if (updatedOrder) {
        setOrder(updatedOrder);
        onUpdated?.(updatedOrder);
      } else {
        setOrder((previous) => ({
          ...previous,
          orderStatus: nextStatus,
        }));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update order status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !updating) {
      onClose();
    }
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!orderId) {
    return null;
  }

  return (
    <div
      className="order-detail-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        className="order-detail-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-order-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="order-detail-header">
          <div>
            <h2 id="seller-order-detail-title" className="order-detail-title">
              Order Details
            </h2>

            {order && (
              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                #{order.orderNumber || order._id?.substring(0, 8)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            aria-label="Close order details"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: updating ? "not-allowed" : "pointer",
              fontSize: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiX />
          </button>
        </div>

        {loading && (
          <div
            className="seller-empty-state"
            style={{
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <FiRefreshCw
              style={{
                animation: "sellerSpin 1s linear infinite",
                marginBottom: "10px",
              }}
            />

            <p>Loading order details...</p>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px",
              marginBottom: "20px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && !order && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            Order details not found.
          </div>
        )}

        {!loading && order && (
          <>
            {/* CUSTOMER INFORMATION */}
            <section>
              <h3 className="order-detail-section-title">
                Customer Information
              </h3>

              <div
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#f8fafc",
                    fontWeight: "700",
                  }}
                >
                  {order.user?.name || order.customer?.name || "Customer"}
                </p>

                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  {order.user?.email ||
                    order.customer?.email ||
                    "Email not available"}
                </p>

                {(order.user?.phone || order.customer?.phone) && (
                  <p
                    style={{
                      margin: 0,
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}
                  >
                    {order.user?.phone || order.customer?.phone}
                  </p>
                )}
              </div>
            </section>

            {/* STATUS */}
            <section>
              <h3 className="order-detail-section-title">Order Status</h3>

              <div className="order-detail-status-box">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    className={`seller-order-status-tag ${
                      order.orderStatus || ""
                    }`}
                  >
                    {getStatusIcon(order.orderStatus)}

                    {getStatusLabel(order.orderStatus || "unknown")}
                  </span>
                </div>

                {getNextStatus(order.orderStatus) && (
                  <button
                    type="button"
                    className="order-detail-status-btn"
                    onClick={handleUpdateStatus}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <FiRefreshCw
                          style={{
                            animation: "sellerSpin 1s linear infinite",
                          }}
                        />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiTruck />
                        Move to{" "}
                        {getStatusLabel(getNextStatus(order.orderStatus))}
                      </>
                    )}
                  </button>
                )}

                {!getNextStatus(order.orderStatus) && (
                  <span
                    style={{
                      color: "#4ade80",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    No further action required
                  </span>
                )}
              </div>
            </section>

            {/* ITEMS */}
            <section>
              <h3 className="order-detail-section-title">Your Products</h3>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="order-detail-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(order.items || []).map((item, index) => {
                      const quantity = Number(item.quantity || 0);

                      const price = Number(
                        item.price ?? item.product?.price ?? 0,
                      );

                      const total = price * quantity;

                      return (
                        <tr key={item._id || item.product?._id || index}>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              {item.product?.images?.[0]?.url && (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product?.name || "Product"}
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid #334155",
                                  }}
                                />
                              )}

                              <div>
                                <strong>
                                  {item.product?.name ||
                                    item.productName ||
                                    "Product"}
                                </strong>

                                {item.variant && (
                                  <small
                                    style={{
                                      display: "block",
                                      color: "#64748b",
                                      marginTop: "3px",
                                    }}
                                  >
                                    {item.variant}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>{quantity}</td>

                          <td>{formatCurrency(price)}</td>

                          <td
                            style={{
                              fontWeight: "700",
                            }}
                          >
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <section style={{ marginTop: "24px" }}>
              <h3 className="order-detail-section-title">Order Summary</h3>

              <div
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    Your Subtotal
                  </span>

                  <strong
                    style={{
                      color: "#f8fafc",
                    }}
                  >
                    {formatCurrency(order.sellerSubtotal)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    Payment Method
                  </span>

                  <span
                    style={{
                      color: "#e2e8f0",
                      textTransform: "uppercase",
                    }}
                  >
                    {order.paymentMethod || "N/A"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    Payment Status
                  </span>

                  <span
                    style={{
                      color:
                        order.paymentStatus === "completed"
                          ? "#4ade80"
                          : "#f59e0b",
                      fontWeight: "600",
                    }}
                  >
                    {getStatusLabel(order.paymentStatus || "N/A")}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "20px",
                    paddingTop: "12px",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    Order Date
                  </span>

                  <span
                    style={{
                      color: "#e2e8f0",
                    }}
                  >
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* SHIPPING ADDRESS */}
            {order.shippingAddress && (
              <section
                style={{
                  marginTop: "24px",
                }}
              >
                <h3 className="order-detail-section-title">Shipping Address</h3>

                <div
                  style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    padding: "16px",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    lineHeight: "1.7",
                  }}
                >
                  <strong
                    style={{
                      color: "#f8fafc",
                    }}
                  >
                    {order.shippingAddress.name ||
                      order.user?.name ||
                      "Customer"}
                  </strong>

                  <br />

                  {order.shippingAddress.addressLine1 && (
                    <>
                      {order.shippingAddress.addressLine1}
                      <br />
                    </>
                  )}

                  {order.shippingAddress.addressLine2 && (
                    <>
                      {order.shippingAddress.addressLine2}
                      <br />
                    </>
                  )}

                  {[
                    order.shippingAddress.city,
                    order.shippingAddress.state,
                    order.shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerOrderDetailModal;
