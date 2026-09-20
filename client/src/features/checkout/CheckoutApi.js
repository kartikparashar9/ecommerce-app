import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";

const data = unwrapApiResponse;

const validatePayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Valid checkout data is required");
  }
  return payload;
};

export const getCheckoutSummaryApi = async (payload = {}) =>
  data(await API.post("/checkout/summary", validatePayload(payload)));

export const validateCheckoutApi = async (payload = {}) =>
  data(await API.post("/checkout/validate", validatePayload(payload)));

export default API;
