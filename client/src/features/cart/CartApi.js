import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { isObjectId, isPositiveInteger, requireId } from "../utils/validation";

const data = unwrapApiResponse;

const validateCartPayload = (payload = {}) => {
  if (!isObjectId(String(payload.productId || ""))) {
    throw new Error("Valid product ID is required");
  }

  if (!isPositiveInteger(payload.quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  if (payload.variantId != null && !isObjectId(String(payload.variantId))) {
    throw new Error("Invalid variant ID");
  }

  return {
    productId: String(payload.productId).trim(),
    quantity: Number(payload.quantity),
    ...(payload.variantId ? { variantId: String(payload.variantId).trim() } : {}),
  };
};

export const getCartApi = async () => data(await API.get("/cart"));

export const addToCartApi = async (payload) =>
  data(await API.post("/cart", validateCartPayload(payload)));

export const updateCartItemApi = async (itemId, payload = {}) => {
  const id = requireId(itemId, "cart item ID");
  if (!isPositiveInteger(payload.quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  return data(await API.patch(`/cart/${encodeURIComponent(id)}`, { quantity: Number(payload.quantity) }));
};

export const removeCartItemApi = async (itemId) =>
  data(await API.delete(`/cart/${encodeURIComponent(requireId(itemId, "cart item ID"))}`));

export const clearCartApi = async () => data(await API.delete("/cart"));

export default API;
