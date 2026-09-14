import API from "../../api/Api";
const data = (r) => r?.data;
export const getBusinessApi = async () => data(await API.get("/business"));
export const createBusinessApi = async (payload) => data(await API.post("/business", payload));
export const updateBusinessApi = async (payload) => data(await API.put("/business", payload));
export default API;
