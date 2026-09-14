import API from "../../api/Api";
const data = (r) => r?.data;
export const createPaymentOrderApi = async (payload) => data(await API.post("/payment/create-order", payload));
export const verifyPaymentApi = async (payload) => data(await API.post("/payment/verify", payload));
export const getPaymentByOrderApi = async (orderId) => data(await API.get(`/payment/order/${orderId}`));
export default API;
