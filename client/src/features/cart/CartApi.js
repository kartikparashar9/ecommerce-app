import API from "../../api/Api";
const data = (r) => r?.data;
export const getCartApi = async () => data(await API.get("/cart"));
export const addToCartApi = async (payload) => data(await API.post("/cart", payload));
export const updateCartItemApi = async (itemId, payload) => data(await API.patch(`/cart/${itemId}`, payload));
export const removeCartItemApi = async (itemId) => data(await API.delete(`/cart/${itemId}`));
export const clearCartApi = async () => data(await API.delete("/cart"));
export default API;
