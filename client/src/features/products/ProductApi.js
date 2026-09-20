import API from "../../api/Api";
import { isObjectId } from "../utils/validation";

// =====================================================
// RESPONSE NORMALIZER
// =====================================================

const unwrapResponse = (response) => {
  const body = response?.data;

  if (!body || typeof body !== "object") {
    return null;
  }

  // ---------------------------------------------------
  // Normal backend response:
  // {
  //   data: { product },
  //   message: "Product fetched successfully"
  // }
  // ---------------------------------------------------

  if (
    body.data &&
    typeof body.data === "object" &&
    !Array.isArray(body.data)
  ) {
    return body.data;
  }

  // ---------------------------------------------------
  // Current backend response shape:
  // {
  //   data: "Product fetched successfully",
  //   message: { product }
  // }
  // ---------------------------------------------------

  if (
    body.message &&
    typeof body.message === "object" &&
    !Array.isArray(body.message)
  ) {
    return body.message;
  }

  return body;
};

// =====================================================
// CLEAN QUERY PARAMS
// =====================================================

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );

// =====================================================
// GET ACTIVE PRODUCTS
// =====================================================

export const getProductsApi = async (params = {}) => {
  const response = await API.get("/products/active", {
    params: cleanParams({
      page: params.page,
      limit: params.limit,
      search: params.search,
      category: params.category,
      brand: params.brand,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
    }),
  });

  const data = unwrapResponse(response);

  return {
    products: Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
        ? data.products
        : [],

    pagination:
      data?.pagination &&
      typeof data.pagination === "object"
        ? data.pagination
        : null,
  };
};

// =====================================================
// GET PRODUCT BY SLUG
// =====================================================

export const getProductBySlugApi = async (slug) => {
  const normalizedSlug = slug?.trim().toLowerCase();

  if (!normalizedSlug) {
    throw new Error("Product slug is required");
  }

  const response = await API.get(
    `/products/slug/${encodeURIComponent(normalizedSlug)}`,
  );

  const product = unwrapResponse(response);

  if (!product || typeof product !== "object") {
    throw new Error("Product data not found");
  }

  return product;
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

export const getProductByIdApi = async (productId) => {
  if (!isObjectId(String(productId || ""))) {
    throw new Error("Product ID is required");
  }

  const response = await API.get(
    `/products/${encodeURIComponent(productId)}`,
  );

  const product = unwrapResponse(response);

  if (!product || typeof product !== "object") {
    throw new Error("Product data not found");
  }

  return product;
};

// =====================================================
// GET PRODUCT REVIEWS
// =====================================================

export const getProductReviewsApi = async (productId) => {
  if (!isObjectId(String(productId || ""))) {
    throw new Error("Product ID is required");
  }

  const response = await API.get(
    `/reviews/product/${encodeURIComponent(productId)}`,
  );

  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.reviews)) {
    return data.reviews;
  }

  return [];
};

