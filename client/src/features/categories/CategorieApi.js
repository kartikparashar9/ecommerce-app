import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

export const getCategoriesApi = async (params = {}) =>
  data(await API.get("/categories", { params }));

export const getCategoryByIdApi = async (id) =>
  data(
    await API.get(
      `/categories/${encodeURIComponent(requireId(id, "category ID"))}`,
    ),
  );

export const getSubcategoriesApi = async (categoryId) =>
  data(
    await API.get(
      `/categories/${encodeURIComponent(requireId(categoryId, "category ID"))}/subcategories`,
    ),
  );

export default API;
