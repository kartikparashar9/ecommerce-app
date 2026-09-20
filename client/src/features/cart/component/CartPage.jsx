import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../cart/CartSlice";
import { resolveMediaUrl } from "../../utils/media";
import "../../user/component/UserPages.css";
import "./CartPage.css";
import { getCartItemPricing } from "../../utils/pricing";

const getItemId = (item) =>
  item?._id ||
  item?.id ||
  item?.cartItemId ||
  null;

const getProduct = (item) =>
  item?.product && typeof item.product === "object"
    ? item.product
    : item;

const getProductId = (item) =>
  getProduct(item)?._id ||
  getProduct(item)?.id ||
  item?.productId ||
  null;

const getItemTotal = (item, price, quantity) => {
  const itemTotal = Number(item?.itemTotal);

  return Number.isFinite(itemTotal)
    ? itemTotal
    : price * quantity;
};

const getMrp = (item) => getCartItemPricing(item).mrp;

const getStock = (product) =>
  Math.max(
    Number(
      product?.totalStock ??
        product?.stock ??
        product?.quantity ??
        0,
    ) || 0,
    0,
  );

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items = [],
    summary,
    loading,
    error,
  } = useSelector((state) => state.cart || {});

  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const totals = useMemo(() => {
    const summarySubtotal = Number(summary?.mrpSubtotal ?? summary?.subtotal);
    const subtotal = Number.isFinite(summarySubtotal)
      ? summarySubtotal
      : items.reduce((sum, item) => {
          const pricing = getCartItemPricing(item);
          return sum + pricing.mrp * Number(item?.quantity || 0);
        }, 0);

    const productDiscount = Number(summary?.productDiscount ?? items.reduce((sum, item) => sum + getCartItemPricing(item).productDiscount * Number(item?.quantity || 0), 0)) || 0;
    const sellingSubtotal = Number(summary?.sellingSubtotal ?? (subtotal - productDiscount));
    const couponDiscount = Number(summary?.couponDiscount ?? 0) || 0;
    const discount = Number(summary?.discount ?? productDiscount + couponDiscount) || 0;
    const shipping = Number(summary?.shipping ?? summary?.shippingFee ?? 0) || 0;
    const tax = Number(summary?.tax ?? 0) || 0;
    const totalFromSummary = Number(summary?.total);

    return {
      subtotal,
      productDiscount,
      sellingSubtotal,
      couponDiscount,
      discount,
      shipping,
      tax,
      total: Number.isFinite(totalFromSummary)
        ? totalFromSummary
        : sellingSubtotal - couponDiscount + shipping + tax,
    };
  }, [items, summary]);

  const changeQuantity = async (item, quantity) => {
    const itemId = getItemId(item);
    const stock = getStock(getProduct(item));

    if (
      !itemId ||
      quantity < 1 ||
      (stock > 0 && quantity > stock)
    ) {
      return;
    }

    try {
      setBusyId(itemId);
      await dispatch(
        updateCartItem({
          itemId,
          payload: { quantity },
        }),
      ).unwrap();
    } catch {
      // Redux stores the error.
    } finally {
      setBusyId("");
    }
  };

  const remove = async (itemId) => {
    if (!itemId) return;

    try {
      setBusyId(itemId);
      await dispatch(
        removeCartItem(itemId),
      ).unwrap();
    } catch {
      // Redux stores the error.
    } finally {
      setBusyId("");
    }
  };

  const clear = async () => {
    if (
      !items.length ||
      !window.confirm(
        "Remove all items from your cart?",
      )
    ) {
      return;
    }

    try {
      await dispatch(clearCart()).unwrap();
    } catch {
      // Redux stores the error.
    }
  };

  return (
    <main className="user-page cart-page">
      <header className="user-page__header">
        <div>
          <span className="user-eyebrow">
            SHOPPING BAG
          </span>
          <h1>Your Cart</h1>
          <p>
            {items.length} item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            className="user-text-button"
            onClick={clear}
          >
            Clear cart
          </button>
        )}
      </header>

      {error && (
        <div className="user-alert">{error}</div>
      )}

      {loading && !items.length ? (
        <div className="user-state">
          Loading your cart...
        </div>
      ) : !items.length ? (
        <div className="user-empty">
          <ShoppingBag size={36} />
          <h2>Your cart is empty</h2>
          <p>Add products to continue shopping.</p>
          <Link
            to="/search"
            className="user-primary-button"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            {items.map((item) => {
              const product = getProduct(item);
              const itemId = getItemId(item);
              const quantity = Math.max(
                1,
                Number(item?.quantity) || 1,
              );

              const pricing = getCartItemPricing(item);
              const price = pricing.sellingPrice;
              const mrp = pricing.mrp;
              const stock = getStock(product);
              const outOfStock = stock <= 0;
              const image = resolveMediaUrl(
                product?.image ||
                  product?.images?.[0],
              );

              return (
                <article
                  className={`cart-item ${
                    outOfStock
                      ? "cart-item--out"
                      : ""
                  }`}
                  key={itemId}
                >
                  <div className="cart-item__image">
                    {image ? (
                      <img
                        src={image}
                        alt={
                          product?.name ||
                          "Product"
                        }
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="cart-item__body">
                    <Link
                      to={
                        product?.slug
                          ? `/product/${encodeURIComponent(
                              product.slug,
                            )}`
                          : "/search"
                      }
                      className="cart-item__name"
                    >
                      {product?.name || "Product"}
                    </Link>

                    {product?.description && (
                      <p className="cart-item__description">
                        {product.description}
                      </p>
                    )}

                    <div className="cart-item__price-row">
                      <strong>₹{price.toLocaleString("en-IN")}</strong>
                      {mrp > price && <del>MRP ₹{mrp.toLocaleString("en-IN")}</del>}
                    </div>
                    {pricing.discountPercent > 0 && (
                      <small>
                        {pricing.discountPercent}% OFF · You save ₹{pricing.productDiscount.toLocaleString("en-IN")}
                      </small>
                    )}

                    <span
                      className={`cart-item__stock ${
                        outOfStock
                          ? "out"
                          : "in"
                      }`}
                    >
                      {outOfStock
                        ? "Out of Stock"
                        : stock <= 5
                          ? `Only ${stock} left`
                          : "In Stock"}
                    </span>

                    <div className="cart-item__controls">
                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={
                            busyId === itemId ||
                            quantity <= 1 ||
                            outOfStock
                          }
                          onClick={() =>
                            changeQuantity(
                              item,
                              quantity - 1,
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>

                        <strong>{quantity}</strong>

                        <button
                          type="button"
                          disabled={
                            busyId === itemId ||
                            outOfStock ||
                            quantity >= stock
                          }
                          onClick={() =>
                            changeQuantity(
                              item,
                              quantity + 1,
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="user-danger-button"
                        disabled={
                          busyId === itemId
                        }
                        onClick={() =>
                          remove(itemId)
                        }
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div>
              <span>MRP Subtotal</span>
              <strong>₹{totals.subtotal.toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Product Discount</span>
              <strong>-₹{totals.productDiscount.toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Selling Price</span>
              <strong>₹{totals.sellingSubtotal.toLocaleString("en-IN")}</strong>
            </div>
            {totals.couponDiscount > 0 && (
              <div>
                <span>Coupon Discount</span>
                <strong>-₹{totals.couponDiscount.toLocaleString("en-IN")}</strong>
              </div>
            )}

            {summary?.shipping != null && (
              <div>
                <span>Shipping</span>
                <strong>
                  ₹
                  {Number(
                    summary.shipping || 0,
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            )}

            <div className="cart-summary__total">
              <span>Total</span>
              <strong>
                ₹
                {totals.total.toLocaleString(
                  "en-IN",
                )}
              </strong>
            </div>

            <button
              type="button"
              className="user-primary-button"
              disabled={items.some(
                (item) =>
                  getStock(getProduct(item)) <= 0,
              )}
              onClick={() => navigate("/checkout")}
            >
              Continue to Checkout
            </button>

            <Link
              to="/search"
              className="user-secondary-button"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
};

export default CartPage;
