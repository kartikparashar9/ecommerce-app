import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";

import { fetchOrderById } from "../../order/OrderSlice";
import { resolveMediaUrl } from "../../utils/media";

import "../../user/component/UserPages.css";
import "./OrderDetails.css";

const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatMoney = (value) =>
  `₹${money(value).toLocaleString("en-IN")}`;

const formatStatus = (status) =>
  String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSellingPrice = (item) => money(item?.price ?? 0);
const getMrp = (item) => money(item?.mrp ?? item?.variant?.mrp ?? item?.variant?.price ?? item?.price);

const getLineTotal = (item, sellingPrice, quantity) => {
  const itemTotal = Number(item?.itemTotal);
  return Number.isFinite(itemTotal)
    ? itemTotal
    : sellingPrice * quantity;
};

const getImage = (item, product) =>
  resolveMediaUrl(
    item?.image ||
      item?.images?.[0] ||
      product?.image ||
      product?.images?.[0],
  );

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();

  const { current, loading, error } = useSelector(
    (state) => state.orders || {},
  );

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  const items = Array.isArray(current?.items)
    ? current.items
    : [];

  const priceSummary = useMemo(() => {
    const subtotal = money(
      current?.subtotal ?? current?.subTotal,
    );

    const productDiscount = money(current?.productDiscount);
    const couponDiscount = money(current?.couponDiscount);
    const discount = money(current?.discount ?? productDiscount + couponDiscount);

    const sellingSubtotal = money(current?.sellingSubtotal ?? subtotal - productDiscount);

    const shipping = money(
      current?.shippingFee ??
        current?.shipping ??
        current?.shippingCharges,
    );

    const tax = money(current?.tax);

    const serverTotal = Number(current?.totalAmount);

    const calculatedTotal =
      sellingSubtotal - couponDiscount + shipping + tax;

    return {
      subtotal,
      productDiscount,
      sellingSubtotal,
      couponDiscount,
      discount,
      shipping,
      tax,
      total: Number.isFinite(serverTotal)
        ? serverTotal
        : calculatedTotal,
      calculatedTotal,
    };
  }, [current]);

  if (loading && !current) {
    return (
      <main className="user-page">
        <div className="user-state">Loading order...</div>
      </main>
    );
  }

  if (error || !current) {
    return (
      <main className="user-page">
        <div className="user-empty">
          <PackageCheck size={36} />

          <h2>Order not available</h2>

          <p>{error || "We could not load this order."}</p>

          <Link to="/orders" className="user-primary-button">
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const status =
    current?.orderStatus || current?.status || "pending";

  const statusClass = String(status)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replaceAll("_", "-");

  return (
    <main className="user-page order-details-page">
      <Link to="/orders" className="user-back-link">
        <ArrowLeft size={15} />
        Back to Orders
      </Link>

      <header className="user-page__header order-detail-header">
        <div>
          <span className="user-eyebrow">ORDER DETAILS</span>

          <h1>
            #{current.orderNumber || current.orderId || current._id}
          </h1>

          <p>{formatDate(current.createdAt)}</p>
        </div>

        <span
          className={`order-status order-status--${statusClass}`}
        >
          {formatStatus(status)}
        </span>
      </header>

      <div className="order-detail-actions">
        <Link
          to={`/orders/${encodeURIComponent(orderId)}/track`}
          className="user-primary-button"
        >
          <MapPin size={15} />
          Track Order
        </Link>
      </div>

      <section className="order-detail-layout">
        <div className="order-detail-items">
          {items.length ? (
            items.map((item, index) => {
              const product =
                item?.product &&
                typeof item.product === "object"
                  ? item.product
                  : item;

              const quantity = Math.max(
                1,
                Number(item?.quantity) || 1,
              );

              const sellingPrice = getSellingPrice(item);
              const mrp = getMrp(item);
              const lineProductDiscount = money(item?.productDiscount ?? mrp - sellingPrice);
              const lineTotal = getLineTotal(
                item,
                sellingPrice,
                quantity,
              );

              const image = getImage(item, product);

              return (
                <article
                  className="order-detail-item order-detail-item--rich"
                  key={item?._id || item?.productId || index}
                >
                  <div className="order-detail-item__product">
                    <div className="order-detail-item__image">
                      {image ? (
                        <img
                          src={image}
                          alt={product?.name || "Product"}
                        />
                      ) : (
                        <PackageCheck size={22} />
                      )}
                    </div>

                    <div className="order-detail-item__info">
                      <strong>
                        {product?.name ||
                          item?.name ||
                          "Product"}
                      </strong>

                      <small>
                        Quantity: {quantity}
                      </small>

                      <div className="order-detail-item__prices">
                        <b>{formatMoney(sellingPrice)}</b>
                        {mrp > sellingPrice && <del>MRP {formatMoney(mrp)}</del>}
                      </div>
                      {lineProductDiscount > 0 && <small>{money(item?.productDiscountPercent)}% OFF · Save {formatMoney(lineProductDiscount)}</small>}
                    </div>
                  </div>

                  <strong className="order-detail-item__line-total">
                    {formatMoney(lineTotal)}
                  </strong>
                </article>
              );
            })
          ) : (
            <div className="user-empty">
              <PackageCheck size={30} />
              <h2>No item details available</h2>
              <p>
                The order was loaded, but its item snapshot was not
                returned by the API.
              </p>
            </div>
          )}
        </div>

        <aside className="cart-summary order-summary-card">
          <h2>Order Summary</h2>

          <div>
            <span>MRP Subtotal</span>
            <strong>{formatMoney(priceSummary.subtotal)}</strong>
          </div>

          <div>
            <span>Product Discount</span>
            <strong className="order-price-discount">-{formatMoney(priceSummary.productDiscount)}</strong>
          </div>

          <div>
            <span>Selling Price</span>
            <strong>{formatMoney(priceSummary.sellingSubtotal)}</strong>
          </div>

          {priceSummary.couponDiscount > 0 && (
            <div>
              <span>Coupon Discount</span>
              <strong className="order-price-discount">-{formatMoney(priceSummary.couponDiscount)}</strong>
            </div>
          )}

          <div>
            <span>Shipping</span>
            <strong>
              {formatMoney(priceSummary.shipping)}
            </strong>
          </div>

          {priceSummary.tax > 0 && (
            <div>
              <span>Tax</span>
              <strong>
                {formatMoney(priceSummary.tax)}
              </strong>
            </div>
          )}

          <div className="cart-summary__total">
            <span>Total</span>
            <strong>{formatMoney(priceSummary.total)}</strong>
          </div>

          <div className="order-summary-meta">
            <span>Payment</span>
            <strong>
              {formatStatus(
                current?.paymentStatus || "pending",
              )}
            </strong>
          </div>

          <div className="order-summary-meta">
            <span>Order Status</span>
            <strong>{formatStatus(status)}</strong>
          </div>

          <Link
            to={`/orders/${encodeURIComponent(orderId)}/track`}
            className="user-primary-button"
          >
            <Truck size={15} />
            Track Order
          </Link>
        </aside>
      </section>
    </main>
  );
};

export default OrderDetailsPage;
