import API from "../../api/Api";
const data = (r) => r?.data;
export const getProductReviewsApi = async (productId, params = {}) => data(await API.get(`/reviews/product/${productId}`, { params }));
export const createReviewApi = async (payload) => data(await API.post("/reviews", payload));
export const updateReviewApi = async (reviewId, payload) => data(await API.put(`/reviews/${reviewId}`, payload));
export const deleteReviewApi = async (reviewId) => data(await API.delete(`/reviews/${reviewId}`));
export default API;
