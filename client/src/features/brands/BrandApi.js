import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { requireId } from "../utils/validation";

const data = unwrapApiResponse;

export const getBrandsApi = async (params = {}) =>
  data(await API.get("/brands", { params }));

export const getBrandByIdApi = async (id) =>
  data(await API.get(`/brands/${encodeURIComponent(requireId(id, "brand ID"))}`));

export default API;
