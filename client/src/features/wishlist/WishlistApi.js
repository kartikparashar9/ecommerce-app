import API from "../../api/Api";
const data = (r) => r?.data;
export const getWishlistApi = async () => data(await API.get("/wishlist"));
export const addToWishlistApi = async (productId) => data(await API.post("/wishlist", { productId }));
export const removeFromWishlistApi = async (productId) => data(await API.delete(`/wishlist/${productId}`));
export default API;
