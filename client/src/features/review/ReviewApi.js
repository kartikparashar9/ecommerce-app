import API from "../../api/Api";
import { unwrapApiResponse } from "../utils/apiResponse";
import { isObjectId, requireId } from "../utils/validation";

const data = unwrapApiResponse;

const validateReviewPayload = (payload = {}) => {
  if (payload.productId != null && !isObjectId(String(payload.productId))) {
    throw new Error("Invalid product ID");
  }

  const rating = Number(payload.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (payload.title != null && String(payload.title).trim().length > 120) {
    throw new Error("Review title is too long");
  }

  const comment = String(payload.comment || "").trim();

  if (!comment || comment.length > 2000) {
    throw new Error(
      "Review comment is required and must be 2000 characters or less",
    );
  }

  return {
    ...payload,

    ...(payload.productId
      ? {
          productId: String(payload.productId).trim(),
        }
      : {}),

    ...(payload.variantId
      ? {
          variantId: String(payload.variantId).trim(),
        }
      : {}),

    rating,

    title:
      payload.title && String(payload.title).trim()
        ? String(payload.title).trim()
        : undefined,

    comment,
  };
};

export const getProductReviewsApi = async (productId, params = {}) =>
  data(
    await API.get("/reviews", {
      params: {
        productId: requireId(productId, "product ID"),
        ...params,
      },
    }),
  );

export const createReviewApi = async (payload) =>
  data(await API.post("/reviews", validateReviewPayload(payload)));

export const updateReviewApi = async (reviewId, payload) =>
  data(
    await API.patch(
      `/reviews/${encodeURIComponent(requireId(reviewId, "review ID"))}`,
      validateReviewPayload(payload),
    ),
  );

export const deleteReviewApi = async (reviewId) =>
  data(
    await API.delete(
      `/reviews/${encodeURIComponent(requireId(reviewId, "review ID"))}`,
    ),
  );

export default API;
