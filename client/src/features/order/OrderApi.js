import API from "../../api/Api";
const data = (r) => r?.data;
export const getOrdersApi = async (params = {}) => data(await API.get("/orders", { params }));
export const getOrderByIdApi = async (orderId) => data(await API.get(`/orders/${orderId}`));
export const createOrderApi = async (payload) => data(await API.post("/orders", payload));
export const cancelOrderApi = async (orderId, payload = {}) => data(await API.patch(`/orders/${orderId}/cancel`, payload));
export default API;
