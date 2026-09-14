import API from "../../api/Api";
const data = (r) => r?.data;
export const getBrandsApi = async (params = {}) => data(await API.get("/brands", { params }));
export const getBrandByIdApi = async (id) => data(await API.get(`/brands/${id}`));
export default API;
