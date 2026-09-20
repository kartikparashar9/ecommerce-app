import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Truck } from "lucide-react";

import { fetchOrders } from "../../order/OrderSlice";

import "../../user/component/UserPages.css";
import "./Orders.css";

const getId = (order) =>
  order?._id || order?.id || order?.orderId || "";

const getNumber = (order) =>
  order?.orderNumber || order?.orderId || getId(order);

const getMoney = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value) =>
  `₹${getMoney(value).toLocaleString("en-IN")}`;

const getTotal = (order) => {
  const totalAmount = Number(order?.totalAmount);

  if (Number.isFinite(totalAmount)) {
    return totalAmount;
  }

  const subtotal = getMoney(order?.subtotal ?? order?.subTotal);
  const productDiscount = getMoney(order?.productDiscount);
  const couponDiscount = getMoney(order?.couponDiscount);
  const discount = getMoney(order?.discount ?? productDiscount + couponDiscount);
  const sellingSubtotal = getMoney(order?.sellingSubtotal ?? subtotal - productDiscount);
  const shipping = getMoney(
    order?.shippingFee ?? order?.shipping ?? order?.shippingCharges,
  );
  const tax = getMoney(order?.tax);

  return sellingSubtotal - couponDiscount + shipping + tax;
};

const getStatus = (order) =>
  order?.orderStatus || order?.status || "pending";

const formatStatus = (status) =>
  String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (date, withTime = false) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
};

const OrdersPage = () => {
  const dispatch = useDispatch();

  const {
    items = [],
    pagination,
    loading,
    error,
  } = useSelector((state) => state.orders || {});

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchOrders({ page, limit: 10 }));
  }, [dispatch, page]);

  return (
    <main className="user-page orders-page">
      <header className="user-page__header">
        <div>
          <span className="user-eyebrow">PURCHASE HISTORY</span>
          <h1>My Orders</h1>
          <p>
            View your orders, exact payment totals and delivery progress.
          </p>
        </div>
      </header>

      {error && <div className="user-alert">{error}</div>}

      {loading && !items.length ? (
        <div className="user-state">Loading orders...</div>
      ) : !items.length ? (
        <div className="user-empty">
          <Package size={36} />
          <h2>No orders yet</h2>
          <p>Your purchases will appear here after you place an order.</p>
        </div>
      ) : (
        <section className="orders-list">
          {items.map((order) => {
            const id = getId(order);
            const status = getStatus(order);
            const statusClass = String(status)
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replaceAll("_", "-");

            const subtotal = getMoney(
              order?.subtotal ?? order?.subTotal,
            );

            const productDiscount = getMoney(order?.productDiscount);
            const couponDiscount = getMoney(order?.couponDiscount);
            const discount = getMoney(order?.discount ?? productDiscount + couponDiscount);
            const sellingSubtotal = getMoney(order?.sellingSubtotal ?? subtotal - productDiscount);

            const shipping = getMoney(
              order?.shippingFee ??
                order?.shipping ??
                order?.shippingCharges,
            );

            const total = getTotal(order);

            return (
              <article className="order-card order-card--full" key={id}>
                <div className="order-card__main">
                  <div className="order-card__top">
                    <div>
                      <span className="order-card__id">
                        Order #{getNumber(order)}
                      </span>

                      <small>
                        {formatDate(order?.createdAt, true)}
                      </small>
                    </div>

                    <span
                      className={`order-status order-status--${statusClass}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className="order-card__pricing">
                    <div>
                      <span>MRP Subtotal</span>
                      <strong>
                        {subtotal > 0
                          ? formatMoney(subtotal)
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Product Discount</span>
                      <strong className="order-price-discount">-{formatMoney(productDiscount)}</strong>
                    </div>
                    <div>
                      <span>Selling Price</span>
                      <strong>{formatMoney(sellingSubtotal)}</strong>
                    </div>
                    {couponDiscount > 0 && (
                      <div>
                        <span>Coupon Discount</span>
                        <strong className="order-price-discount">-{formatMoney(couponDiscount)}</strong>
                      </div>
                    )}

                    <div>
                      <span>Shipping</span>
                      <strong>
                        {formatMoney(shipping)}
                      </strong>
                    </div>

                    <div className="order-card__total">
                      <span>Total Paid / Payable</span>
                      <strong>{formatMoney(total)}</strong>
                    </div>
                  </div>

                  <div className="order-card__payment">
                    <span>
                      Payment:{" "}
                      <strong>
                        {formatStatus(
                          order?.paymentStatus || "pending",
                        )}
                      </strong>
                    </span>

                    {order?.items?.length > 0 && (
                      <span>
                        {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-card__actions">
                  <Link
                    to={`/orders/${encodeURIComponent(id)}`}
                    className="user-secondary-button"
                  >
                    View Details
                    <ArrowRight size={15} />
                  </Link>

                  <Link
                    to={`/orders/${encodeURIComponent(id)}/track`}
                    className="user-primary-button"
                  >
                    <Truck size={15} />
                    Track Order
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {pagination?.totalPages > 1 && (
        <div className="user-pagination">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>

          <span>
            {pagination.currentPage || page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default OrdersPage;
