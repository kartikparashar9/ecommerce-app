import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

export const getOrdersApi = async (params = {}) =>
  data(await API.get("/orders", { params }));

export const getOrderByIdApi = async (orderId) =>
  data(await API.get(`/orders/${encodeURIComponent(requireId(orderId, "order ID"))}`));

export const createOrderApi = async (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Valid order data is required");
  }
  return data(await API.post("/orders", payload));
};

export const cancelOrderApi = async (orderId, payload = {}) =>
  data(await API.patch(`/orders/${encodeURIComponent(requireId(orderId, "order ID"))}/cancel`, payload));

export default API;
