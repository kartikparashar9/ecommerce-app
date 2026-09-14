import { useEffect, useState } from "react";

import {
  X,
  Package,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import { getAdminOrderById } from "../AdminApi";

import "./AdminOrderDetailsModal.css";

const AdminOrderDetailsModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================
  // FETCH ORDER DETAILS
  // =========================================

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        return;
      }

      try {
        setLoading(true);

        setError("");

        const response = await getAdminOrderById(orderId);

        setOrder(response?.data?.data || null);
      } catch (error) {
        console.error("Admin order details error:", error);

        setError(
          error?.response?.data?.message || "Unable to load order details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================
  // CLOSE ON OVERLAY CLICK
  // =========================================

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="
        admin-order-modal-overlay
      "
      onClick={handleOverlayClick}
    >
      <div
        className="
          admin-order-modal
        "
      >
        {/* =====================================
            HEADER
        ====================================== */}

        <div
          className="
            admin-order-modal-header
          "
        >
          <div>
            <h2>Order Details</h2>

            {!loading && order && <p>#{order.orderNumber || order._id}</p>}
          </div>

          <button
            className="
              admin-order-modal-close
            "
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        {/* =====================================
            CONTENT
        ====================================== */}

        <div
          className="
            admin-order-modal-content
          "
        >
          {/* LOADING */}

          {loading && (
            <div
              className="
                admin-order-modal-state
              "
            >
              Loading order details...
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              className="
                  admin-order-modal-state
                  error
                "
            >
              {error}
            </div>
          )}

          {/* ORDER DETAILS */}

          {!loading && !error && order && (
            <>
              {/* =============================
                    ORDER OVERVIEW
                ============================== */}

              <div
                className="
                    order-details-grid
                  "
              >
                {/* CUSTOMER */}

                <div
                  className="
                      order-details-card
                    "
                >
                  <div
                    className="
                        order-details-card-title
                      "
                  >
                    <User size={18} />

                    <h3>Customer</h3>
                  </div>

                  <p>
                    <strong>Name:</strong> {order?.user?.name || "—"}
                  </p>

                  <p>
                    <strong>Email:</strong> {order?.user?.email || "—"}
                  </p>

                  <p>
                    <strong>Phone:</strong> {order?.user?.phone || "—"}
                  </p>
                </div>

                {/* PAYMENT */}

                <div
                  className="
                      order-details-card
                    "
                >
                  <div
                    className="
                        order-details-card-title
                      "
                  >
                    <CreditCard size={18} />

                    <h3>Payment</h3>
                  </div>

                  <p>
                    <strong>Method:</strong> {order.paymentMethod || "—"}
                  </p>

                  <p>
                    <strong>Payment Status:</strong>{" "}
                    <span
                      className={`
                          order-detail-payment-status
                          ${order.paymentStatus || "pending"}
                          `}
                    >
                      {order.paymentStatus || "Pending"}
                    </span>
                  </p>

                  <p>
                    <strong>Total:</strong> ₹
                    {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* ORDER INFO */}

                <div
                  className="
                      order-details-card
                    "
                >
                  <div
                    className="
                        order-details-card-title
                      "
                  >
                    <ShoppingBag size={18} />

                    <h3>Order Info</h3>
                  </div>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className="
                          order-detail-status
                        "
                    >
                      {order.orderStatus || "Pending"}
                    </span>
                  </p>

                  <p>
                    <strong>Order Date:</strong> {formatDate(order.createdAt)}
                  </p>

                  <p>
                    <strong>Total Items:</strong> {order.items?.length || 0}
                  </p>
                </div>
              </div>

              {/* =============================
                    SHIPPING ADDRESS
                ============================== */}

              <div
                className="
                    order-details-section
                  "
              >
                <div
                  className="
                      order-section-title
                    "
                >
                  <MapPin size={19} />

                  <h3>Shipping Address</h3>
                </div>

                <div
                  className="
                      shipping-address-card
                    "
                >
                  <p>
                    <strong>{order?.shippingAddress?.fullName || "—"}</strong>
                  </p>

                  <p>{order?.shippingAddress?.addressLine1 || "—"}</p>

                  {order?.shippingAddress?.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}

                  <p>
                    {order?.shippingAddress?.city}

                    {", "}

                    {order?.shippingAddress?.state}

                    {" - "}

                    {order?.shippingAddress?.postalCode}
                  </p>

                  <p>{order?.shippingAddress?.country}</p>
                </div>
              </div>

              {/* =============================
                    ORDER ITEMS
                ============================== */}

              <div
                className="
                    order-details-section
                  "
              >
                <div
                  className="
                      order-section-title
                    "
                >
                  <Package size={19} />

                  <h3>Order Items</h3>
                </div>

                <div
                  className="
                      order-items-list
                    "
                >
                  {order.items?.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="
                              order-detail-item
                            "
                    >
                      {/* IMAGE */}

                      <div
                        className="
                                order-detail-item-image
                              "
                      >
                        {item?.image ? (
                          <img
                            src={item.image}
                            alt={item.productName || "Product"}
                          />
                        ) : (
                          <Package size={22} />
                        )}
                      </div>

                      {/* INFO */}

                      <div
                        className="
                                order-detail-item-info
                              "
                      >
                        <h4>
                          {item.productName || item?.product?.name || "Product"}
                        </h4>

                        <p>Quantity: {item.quantity || 0}</p>

                        {item.color && <p>Color: {item.color}</p>}

                        {item.size && <p>Size: {item.size}</p>}
                      </div>

                      {/* PRICE */}

                      <div
                        className="
                                order-detail-item-price
                              "
                      >
                        ₹{Number(item.price || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* =============================
                    PRICE SUMMARY
                ============================== */}

              <div
                className="
                    order-summary-card
                  "
              >
                <h3>Price Summary</h3>

                <div>
                  <span>Subtotal</span>

                  <strong>
                    ₹{Number(order.subtotal || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Shipping Fee</span>

                  <strong>
                    ₹{Number(order.shippingFee || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong>
                    ₹{Number(order.discount || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div
                  className="
                      order-summary-total
                    "
                >
                  <span>Total</span>

                  <strong>
                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailsModal;
