import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createPaymentOrderApi,
  verifyPaymentApi,
} from "../PaymentApi";

import "./PaymentGatewayPage.css";

// =====================================================
// RAZORPAY SCRIPT
// =====================================================

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

// =====================================================
// LOAD RAZORPAY
// =====================================================

const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));

      existingScript.addEventListener("error", () =>
        reject(new Error("Unable to load Razorpay Checkout")),
      );

      return;
    }

    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve(true);
      } else {
        reject(new Error("Razorpay Checkout loaded incorrectly"));
      }
    };

    script.onerror = () => {
      reject(new Error("Unable to load Razorpay Checkout"));
    };

    document.body.appendChild(script);
  });
};

// =====================================================
// API ERROR MESSAGE
// =====================================================

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.description ||
    error?.message ||
    "Something went wrong while processing payment."
  );
};

// =====================================================
// PAYMENT DATA NORMALIZER
// =====================================================

const getPaymentData = (response) => {
  if (!response) {
    return null;
  }

  if (response?.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
};

// =====================================================
// COMPONENT
// =====================================================

const PaymentGatewayPage = () => {
  const { orderId } = useParams();

  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Preparing secure payment...");

  const [retryKey, setRetryKey] = useState(0);

  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  // =================================================
  // CLEANUP
  // =================================================

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =================================================
  // START PAYMENT
  // =================================================

  const startPayment = useCallback(async () => {
    if (!orderId) {
      setStatus("error");
      setMessage("Order ID is missing.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Preparing secure payment...");

      // =========================================
      // CREATE RAZORPAY ORDER
      // =========================================

      const response = await createPaymentOrderApi({
        orderId,
      });

      const payment = getPaymentData(response);

      if (!payment) {
        throw new Error("Invalid payment response from server.");
      }

      // =========================================
      // RAZORPAY ORDER ID
      // =========================================

      const razorpayOrderId =
        payment?.razorpayOrderId ||
        payment?.razorpay_order_id ||
        payment?.razorpayOrder?.id;

      // =========================================
      // RAZORPAY KEY
      // =========================================

      const key = payment?.keyId || payment?.key || payment?.razorpayKeyId;

      // =========================================
      // AMOUNT
      // =========================================

      const gatewayAmount = Number(payment?.amount || 0);

      const amount =
        Number.isFinite(gatewayAmount) && gatewayAmount > 0
          ? Math.round(gatewayAmount)
          : 0;

      // =========================================
      // CURRENCY
      // =========================================

      const currency = String(payment?.currency || "INR").toUpperCase();

      // =========================================
      // VALIDATION
      // =========================================

      if (!razorpayOrderId) {
        throw new Error("Razorpay order ID was not received.");
      }

      if (!String(razorpayOrderId).startsWith("order_")) {
        throw new Error("Invalid Razorpay order ID.");
      }

      if (!key) {
        throw new Error("Razorpay key was not received.");
      }

      if (!amount) {
        throw new Error("Invalid payment amount.");
      }

      if (currency !== "INR") {
        throw new Error("Unsupported payment currency.");
      }

      // =========================================
      // DEBUG
      // =========================================

      console.log("RAZORPAY PAYMENT DATA:", {
        key,
        amount,
        currency,
        razorpayOrderId,
        orderId,
      });

      // =========================================
      // LOAD RAZORPAY
      // =========================================

      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }

      if (!mountedRef.current) {
        return;
      }

      // =========================================
      // RAZORPAY OPTIONS
      // =========================================

      const options = {
        key,

        // IMPORTANT:
        // Backend returns Razorpay amount in paise.
        // DO NOT multiply by 100 here.
        amount,

        currency,

        name: "JustBuy",

        description: `Payment for order ${orderId}`,

        order_id: razorpayOrderId,

        // =====================================
        // SUCCESS HANDLER
        // =====================================

        handler: async (result) => {
          try {
            if (!result) {
              throw new Error("Empty payment response received.");
            }

            const returnedOrderId = result?.razorpay_order_id;

            const returnedPaymentId = result?.razorpay_payment_id;

            const returnedSignature = result?.razorpay_signature;

            if (!returnedOrderId) {
              throw new Error("Razorpay order ID is missing.");
            }

            if (!returnedPaymentId) {
              throw new Error("Razorpay payment ID is missing.");
            }

            if (!returnedSignature) {
              throw new Error("Razorpay payment signature is missing.");
            }

            // Prevent payment response
            // from being used for another order.
            if (returnedOrderId !== razorpayOrderId) {
              throw new Error("Payment order mismatch.");
            }

            if (mountedRef.current) {
              setStatus("verifying");
              setMessage("Payment successful. Verifying payment...");
            }

            // =================================
            // SERVER VERIFICATION
            // =================================

            await verifyPaymentApi({
              orderId,

              razorpayOrderId: returnedOrderId,

              razorpayPaymentId: returnedPaymentId,

              razorpaySignature: returnedSignature,
            });

            if (!mountedRef.current) {
              return;
            }

            // =================================
            // SUCCESS
            // =================================

            setStatus("success");
            setMessage("Payment verified successfully.");

            navigate(`/order-success?orderId=${encodeURIComponent(orderId)}`, {
              replace: true,
            });
          } catch (error) {
            console.error("Payment verification failed:", error);

            if (!mountedRef.current) {
              return;
            }

            setStatus("error");
            setMessage(getErrorMessage(error));
          }
        },

        // =====================================
        // MODAL DISMISS
        // =====================================

        modal: {
          ondismiss: () => {
            if (!mountedRef.current) {
              return;
            }

            setStatus("cancelled");
            setMessage("Payment was cancelled. You can try again.");
          },
        },

        // =====================================
        // RETRY
        // =====================================

        retry: {
          enabled: true,
        },

        // =====================================
        // THEME
        // =====================================

        theme: {
          color: "#2563eb",
        },
      };

      console.log("FINAL RAZORPAY OPTIONS:", {
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id,
      });

      // =========================================
      // CREATE CHECKOUT INSTANCE
      // =========================================

      const razorpay = new window.Razorpay(options);

      // =========================================
      // PAYMENT FAILED
      // =========================================

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response);

        if (!mountedRef.current) {
          return;
        }

        const error = response?.error || {};

        const reason = error?.reason || "";

        const description = error?.description || "";

        let userMessage = "Payment could not be completed. Please try again.";

        // =====================================
        // INTERNATIONAL CARD
        // =====================================

        if (reason === "international_transaction_not_allowed") {
          userMessage =
            "This card is not supported for this payment. Please use an Indian domestic card or choose another payment method.";
        }

        // =====================================
        // CARD / PAYMENT FAILURE
        // =====================================
        else if (description) {
          userMessage = description;
        }

        setStatus("error");
        setMessage(userMessage);
      });

      // =========================================
      // OPEN CHECKOUT
      // =========================================

      console.log("OPENING RAZORPAY CHECKOUT");

      razorpay.open();
    } catch (error) {
      console.error("Unable to start payment:", error);

      if (!mountedRef.current) {
        return;
      }

      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }, [navigate, orderId]);

  // =================================================
  // START ON PAGE LOAD
  // =================================================

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("Order ID is missing.");
      return;
    }

    // React StrictMode can execute effects twice
    // during development.
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    startPayment();
  }, [orderId, startPayment, retryKey]);

  // =================================================
  // RETRY PAYMENT
  // =================================================

  const handleRetry = () => {
    startedRef.current = false;
    setRetryKey((previous) => previous + 1);
  };

  // =================================================
  // GO BACK
  // =================================================

  const handleBack = () => {
    navigate(-1);
  };

  // =================================================
  // UI
  // =================================================

  return (
    <div className="payment-gateway-page">
      <div className="payment-gateway-card">
        {status === "loading" && (
          <>
            <div className="payment-loader">
              <span />
            </div>

            <h2>Preparing Payment</h2>

            <p>Please wait while we securely prepare your payment.</p>
          </>
        )}

        {status === "verifying" && (
          <>
            <div className="payment-loader">
              <span />
            </div>

            <h2>Verifying Payment</h2>

            <p>
              Your payment was received. Please wait while we verify it
              securely.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="payment-status-icon payment-status-success">✓</div>

            <h2>Payment Successful</h2>

            <p>Your payment has been verified successfully.</p>
          </>
        )}

        {status === "cancelled" && (
          <>
            <div className="payment-status-icon">!</div>

            <h2>Payment Cancelled</h2>

            <p>{message}</p>

            <div className="payment-actions">
              <button
                type="button"
                className="payment-primary-button"
                onClick={handleRetry}
              >
                Retry Payment
              </button>

              <button
                type="button"
                className="payment-secondary-button"
                onClick={handleBack}
              >
                Go Back
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="payment-status-icon payment-status-error">!</div>

            <h2>Payment Could Not Be Completed</h2>

            <p>{message}</p>

            <div className="payment-actions">
              <button
                type="button"
                className="payment-primary-button"
                onClick={handleRetry}
              >
                Retry Payment
              </button>

              <button
                type="button"
                className="payment-secondary-button"
                onClick={handleBack}
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentGatewayPage;
