import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

export const createPaymentOrderApi = async (payload) => {
  if (!payload?.orderId) {
    throw new Error("Order ID is required");
  }

  const response = await API.post("/payment/create-order", {
    orderId: payload.orderId,
  });

  return data(response);
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

export const verifyPaymentApi = async (payload) => {
  if (
    !payload?.orderId ||
    !payload?.razorpayOrderId ||
    !payload?.razorpayPaymentId ||
    !payload?.razorpaySignature
  ) {
    throw new Error(
      "Complete payment verification data is required",
    );
  }

  const response = await API.post("/payment/verify", {
    orderId: payload.orderId,
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
  });

  return data(response);
};

// =====================================================
// GET PAYMENT BY ORDER
// =====================================================

export const getPaymentByOrderApi = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const response = await API.get(
    `/payment/order/${encodeURIComponent(
      requireId(orderId, "order ID"),
    )}`,
  );

  return data(response);
};