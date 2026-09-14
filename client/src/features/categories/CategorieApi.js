import API from "../../api/Api";
const data = (r) => r?.data;
export const getCategoriesApi = async (params = {}) => data(await API.get("/categories", { params }));
export const getCategoryByIdApi = async (id) => data(await API.get(`/categories/${id}`));
export const getSubcategoriesApi = async (categoryId) => data(await API.get(`/categories/${categoryId}/subcategories`));
export default API;
