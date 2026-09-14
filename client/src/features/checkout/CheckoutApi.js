import API from "../../api/Api";
const data = (r) => r?.data;
export const getCheckoutSummaryApi = async (payload = {}) => data(await API.post("/checkout/summary", payload));
export const validateCheckoutApi = async (payload = {}) => data(await API.post("/checkout/validate", payload));
export default API;
