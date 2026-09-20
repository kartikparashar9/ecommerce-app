import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  CreditCard,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../address/AddressSlice";
import { fetchCheckoutSummary, validateCheckout } from "../CheckoutSlice";
import { placeOrder } from "../../order/OrderSlice";
import { clearCartLocal } from "../../cart/CartSlice";
import { validateAddressPayload } from "../../utils/validation";
import { resolveMediaUrl } from "../../utils/media";
import "./Checkout.css";

const emptyAddress = {
  type: "home",
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  isDefault: false,
};

const unwrap = (value) => value?.data ?? value;

const getSummary = (value) => {
  const data = unwrap(value);
  return data?.summary || data?.checkout || data || {};
};

const getOrder = (value) => {
  const data = unwrap(value);
  return data?.order || data || {};
};

const getError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const addressState = useSelector((state) => state.addresses || {});
  const cartState = useSelector((state) => state.cart || {});
  const checkoutState = useSelector((state) => state.checkout || {});
  const orderState = useSelector((state) => state.orders || {});

  const addresses = Array.isArray(addressState.items) ? addressState.items : [];

  const cartItems = Array.isArray(cartState.items) ? cartState.items : [];

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });
  const [savingAddress, setSavingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length) {
      const defaultAddress =
        addresses.find((address) => address.isDefault) || addresses[0];

      setSelectedAddressId(defaultAddress?._id || "");
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!selectedAddressId) return;

    dispatch(
      fetchCheckoutSummary({
        addressId: selectedAddressId,
        paymentMethod,
        ...(couponCode ? { couponCode } : {}),
      }),
    );
  }, [dispatch, selectedAddressId, paymentMethod, couponCode]);

  const summary = useMemo(
    () => getSummary(checkoutState.summary),
    [checkoutState.summary],
  );

  // Checkout totals come from the backend checkout summary.
  const subtotal = Number(summary?.subtotal ?? summary?.subTotal ?? 0) || 0;
  const productDiscount = Number(summary?.productDiscount ?? 0) || 0;
  const sellingSubtotal = Number(summary?.sellingSubtotal ?? (subtotal - productDiscount)) || 0;
  const couponDiscount = Number(summary?.couponDiscount ?? 0) || 0;
  const shipping =
    Number(
      summary?.shipping ??
        summary?.shippingFee ??
        summary?.shippingCharges ??
        0,
    ) || 0;
  const tax = Number(summary?.tax || 0) || 0;
  const total = Number(summary?.total);
  const payableTotal = Number.isFinite(total)
    ? total
    : sellingSubtotal - couponDiscount + shipping + tax;

  const buildAddressPayload = (form) => ({
    type: form.type || "home",
    name: String(form.name || "").trim(),
    phone: String(form.phone || "").trim(),
    addressLine1: String(form.addressLine1 || "").trim(),
    addressLine2: String(form.addressLine2 || "").trim(),
    landmark: String(form.landmark || "").trim(),
    city: String(form.city || "").trim(),
    state: String(form.state || "").trim(),
    country: String(form.country || "India").trim(),
    postalCode: String(form.postalCode || "").trim(),
    isDefault: Boolean(form.isDefault),
  });


  const saveNewAddress = async (event) => {
    event.preventDefault();

    try {
      const payload = buildAddressPayload(addressForm);
      validateAddressPayload(payload);
      setSavingAddress(true);
      setPageError("");
      setAddressMessage("");

      let result;

      if (editingAddressId) {
        result = await dispatch(
          updateAddress({
            addressId: editingAddressId,
            payload,
          }),
        ).unwrap();
      } else {
        result = await dispatch(createAddress(payload)).unwrap();
      }

      const data = unwrap(result);
      const savedAddress = data?.address || data || {};

      await dispatch(fetchAddresses()).unwrap();

      if (savedAddress?._id) {
        setSelectedAddressId(savedAddress._id);
      }

      setAddressForm({ ...emptyAddress });
      setEditingAddressId("");
      setAddressFormOpen(false);
      setAddressMessage(
        editingAddressId
          ? "Address updated successfully"
          : "Address added successfully",
      );
    } catch (error) {
      setPageError(getError(error, "Unable to save address"));
    } finally {
      setSavingAddress(false);
    }
  };

  const startEditAddress = (address) => {
    if (!address?._id) return;

    setEditingAddressId(address._id);
    setAddressForm({
      type: address.type || "home",
      name: address.name || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault),
    });
    setAddressFormOpen(true);
    setPageError("");
    setAddressMessage("");
  };

  const removeAddress = async (addressId) => {
    if (!addressId || savingAddress) return;
    if (!window.confirm("Delete this address?")) return;

    try {
      setSavingAddress(true);
      setPageError("");
      setAddressMessage("");

      await dispatch(deleteAddress(addressId)).unwrap();
      const refreshed = await dispatch(fetchAddresses()).unwrap();
      const remaining = Array.isArray(refreshed?.data)
        ? refreshed.data
        : Array.isArray(refreshed)
          ? refreshed
          : [];

      if (selectedAddressId === addressId) {
        const nextAddress =
          remaining.find((address) => address.isDefault) || remaining[0];
        setSelectedAddressId(nextAddress?._id || "");
      }

      if (editingAddressId === addressId) {
        setEditingAddressId("");
        setAddressForm({ ...emptyAddress });
        setAddressFormOpen(false);
      }

      setAddressMessage("Address deleted successfully");
    } catch (error) {
      setPageError(getError(error, "Unable to delete address"));
    } finally {
      setSavingAddress(false);
    }
  };


  const submitCheckout = async (event) => {
    event.preventDefault();

    if (!cartItems.length) {
      setPageError("Your cart is empty.");
      return;
    }

    if (!selectedAddressId) {
      setPageError("Please select a delivery address.");
      return;
    }

    try {
      setSubmitting(true);
      setPageError("");

      const validationResult = await dispatch(
        validateCheckout({
          addressId: selectedAddressId,
          paymentMethod,
          ...(couponCode ? { couponCode } : {}),
        }),
      ).unwrap();

      const validation = unwrap(validationResult);
      if (validation?.valid === false || validation?.isValid === false) {
        throw new Error(validation?.message || "Checkout validation failed.");
      }

      const result = await dispatch(
        placeOrder({
          addressId: selectedAddressId,
          paymentMethod,
          ...(couponCode ? { couponCode } : {}),
        }),
      ).unwrap();

      const order = getOrder(result);
      const orderId = order?._id || order?.id || order?.orderId;

      if (!orderId) {
        throw new Error("Order was created but no order ID was returned.");
      }

      dispatch(clearCartLocal());

      if (paymentMethod === "online") {
        navigate(`/payment/${encodeURIComponent(orderId)}`, {
          state: {
            orderId,
            amount: Number(order?.totalAmount ?? order?.total ?? order?.grandTotal ?? payableTotal),
          },
        });
      } else {
        navigate(`/order-success?orderId=${encodeURIComponent(orderId)}`, {
          replace: true,
        });
      }
    } catch (error) {
      setPageError(getError(error, "Unable to place order"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartItems.length) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add a product before starting checkout.</p>
          <Link to="/search">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <div>
          <span>SECURE CHECKOUT</span>
          <h1>Checkout</h1>
          <p>Select your delivery address and payment method.</p>
        </div>

        <div className="checkout-trust">
          <ShieldCheck size={18} />
          Secure & protected
        </div>
      </header>

      {(pageError || checkoutState.error) && (
        <div className="checkout-alert" role="alert">
          {pageError || checkoutState.error}
        </div>
      )}

      {addressMessage && (
        <div className="checkout-success" role="status">
          {addressMessage}
        </div>
      )}

      <form className="checkout-layout" onSubmit={submitCheckout}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card__heading">
              <div>
                <span className="checkout-step">01</span>
                <div>
                  <h2>Delivery Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAddressId("");
                  setAddressForm({ ...emptyAddress });
                  setAddressFormOpen((open) => !open);
                  setPageError("");
                  setAddressMessage("");
                }}
              >
                <Plus size={16} /> Add new
              </button>
            </div>

            {addressState.loading && !addresses.length ? (
              <div className="checkout-state">Loading addresses...</div>
            ) : addresses.length ? (
              <div className="checkout-address-grid">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address._id;

                  return (
                    <div
                      className={`checkout-address ${
                        selected ? "selected" : ""
                      }`}
                      key={address._id}
                      onClick={() => setSelectedAddressId(address._id)}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selected}
                        onChange={() => setSelectedAddressId(address._id)}
                        onClick={(event) => event.stopPropagation()}
                      />

                      <div className="checkout-address__content">
                        <strong>
                          {address.name || "Address"}
                        </strong>
                        {address.isDefault && (
                          <span className="checkout-default">Default</span>
                        )}
                        <p>
                          {address.addressLine1}
                          {address.addressLine2
                            ? `, ${address.addressLine2}`
                            : ""}
                        </p>
                        <p>
                          {address.city}, {address.state} - {address.postalCode}
                        </p>
                        <small>{address.phone}</small>

                        <div className="checkout-address__actions">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditAddress(address);
                            }}
                            disabled={savingAddress}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeAddress(address._id);
                            }}
                            disabled={savingAddress}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {selected && (
                        <Check className="checkout-address-check" size={18} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="checkout-state">
                <MapPin size={25} />
                <strong>No address saved.</strong>
                <span>Add a delivery address to continue.</span>
              </div>
            )}

            {addressFormOpen && (
              <div className="checkout-new-address">
                <h3>{editingAddressId ? "Edit delivery address" : "Add delivery address"}</h3>

                <div className="checkout-form-grid">
                  {[
                    ["name", "Full name", "text"],
                    ["phone", "Phone", "tel"],
                    ["addressLine1", "Address line 1", "text"],
                    ["addressLine2", "Address line 2", "text"],
                    ["city", "City", "text"],
                    ["state", "State", "text"],
                    ["postalCode", "Postal code", "text"],
                  ].map(([key, label, type]) => (
                    <label
                      key={key}
                      className={
                        key === "addressLine1" || key === "addressLine2"
                          ? "full"
                          : ""
                      }
                    >
                      {label}
                      <input
                        type={type}
                        value={addressForm[key]}
                        onChange={(event) =>
                          setAddressForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        required={key !== "addressLine2"}
                      />
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="checkout-save-address"
                  disabled={savingAddress}
                  onClick={saveNewAddress}
                >
                  {savingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>

                {editingAddressId && (
                  <button
                    type="button"
                    className="checkout-cancel-address"
                    disabled={savingAddress}
                    onClick={() => {
                      setEditingAddressId("");
                      setAddressForm({ ...emptyAddress });
                      setAddressFormOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="checkout-card">
            <div className="checkout-card__heading">
              <div>
                <span className="checkout-step">02</span>
                <div>
                  <h2>Coupon</h2>
                  <p>Apply a valid coupon to your discounted selling price.</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={Boolean(couponCode)}
                aria-label="Coupon code"
              />
              {couponCode ? (
                <button type="button" onClick={() => { setCouponCode(""); setCouponInput(""); setPageError(""); }}>Remove</button>
              ) : (
                <button type="button" onClick={() => { const code = couponInput.trim(); if (!code) { setPageError("Enter a coupon code."); return; } setPageError(""); setCouponCode(code); }}>Apply</button>
              )}
            </div>
            {couponCode && <p style={{ marginTop: 8 }}>Applied coupon: <strong>{couponCode}</strong></p>}
          </section>

          <section className="checkout-card">
            <div className="checkout-card__heading">
              <div>
                <span className="checkout-step">03</span>
                <div>
                  <h2>Payment Method</h2>
                  <p>Choose how you want to pay.</p>
                </div>
              </div>
            </div>

            <div className="checkout-payment-options">
              <label className={paymentMethod === "cod" ? "selected" : ""}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                <Wallet size={20} />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>
              </label>

              <label className={paymentMethod === "online" ? "selected" : ""}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                <CreditCard size={20} />
                <span>
                  <strong>Online Payment</strong>
                  <small>Pay securely using the gateway.</small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="checkout-summary__items">
            {cartItems.map((item) => {
              const product = item?.product || item;

              const price = Number(item?.price ?? item?.variant?.price ?? 0) || 0;
              const itemTotal = Number(item?.itemTotal);
              const displayTotal = Number.isFinite(itemTotal)
                ? itemTotal
                : price * Number(item?.quantity || 1);

              const image = product?.image || product?.images?.[0];

              return (
                <div
                  className="checkout-summary__item"
                  key={item?._id || item?.id || item?.productId}
                >
                  <div className="checkout-summary__image">
                    {image ? (
                      <img
                        src={resolveMediaUrl(image)}
                        alt={product?.name || "Product"}
                      />
                    ) : (
                      <PackageSearchIcon />
                    )}
                  </div>
                  <div>
                    <strong>{product?.name || "Product"}</strong>
                    <span>Qty {item?.quantity || 1}</span>
                  </div>
                  <b>
                    ₹{displayTotal.toLocaleString("en-IN")}
                  </b>
                </div>
              );
            })}
          </div>

          <div className="checkout-summary__line">
            <span>MRP Subtotal</span>
            <b>₹{subtotal.toLocaleString("en-IN")}</b>
          </div>

          <div className="checkout-summary__line">
            <span>Product Discount</span>
            <b>-₹{productDiscount.toLocaleString("en-IN")}</b>
          </div>

          <div className="checkout-summary__line">
            <span>Selling Price</span>
            <b>₹{sellingSubtotal.toLocaleString("en-IN")}</b>
          </div>

          {couponDiscount > 0 && (
            <div className="checkout-summary__line">
              <span>Coupon Discount</span>
              <b>-₹{couponDiscount.toLocaleString("en-IN")}</b>
            </div>
          )}

          <div className="checkout-summary__line">
            <span>Shipping</span>
            <b>₹{shipping.toLocaleString("en-IN")}</b>
          </div>

          {tax > 0 && (
            <div className="checkout-summary__line">
              <span>Tax</span>
              <b>₹{tax.toLocaleString("en-IN")}</b>
            </div>
          )}

          <div className="checkout-summary__total">
            <span>Total</span>
            <strong>₹{payableTotal.toLocaleString("en-IN")}</strong>
          </div>

          <button
            type="submit"
            className="checkout-submit"
            disabled={
              submitting ||
              checkoutState.loading ||
              orderState.loading ||
              !selectedAddressId
            }
          >
            {submitting
              ? "Processing..."
              : paymentMethod === "online"
                ? "Continue to Payment"
                : "Place Order"}
          </button>

          <p className="checkout-secure-note">
            <ShieldCheck size={14} />
            Your checkout is protected.
          </p>
        </aside>
      </form>
    </main>
  );
}

function PackageSearchIcon() {
  return <span className="checkout-image-fallback">—</span>;
}
