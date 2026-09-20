import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

export const getWishlistApi = async () => data(await API.get("/wishlist"));

export const addToWishlistApi = async (productId) =>
  data(await API.post(`/wishlist/${encodeURIComponent(requireId(productId, "product ID"))}`));

export const removeFromWishlistApi = async (productId) =>
  data(await API.delete(`/wishlist/${encodeURIComponent(requireId(productId, "product ID"))}`));

export default API;
