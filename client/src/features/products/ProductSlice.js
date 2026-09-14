import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getProductsApi, getProductBySlugApi } from "./ProductApi";

// =====================================================
// PRODUCT NORMALIZER
// =====================================================

const normalizeProduct = (product) => {
  if (!product || typeof product !== "object") {
    return null;
  }

  const category =
    product.category && typeof product.category === "object"
      ? product.category
      : null;

  const brand =
    product.brand && typeof product.brand === "object" ? product.brand : null;

  const variants = Array.isArray(product.variants)
    ? product.variants.filter(Boolean)
    : [];

  const images = Array.isArray(product.images)
    ? product.images.filter(
        (image) => typeof image === "string" && image.trim(),
      )
    : typeof product.image === "string" && product.image.trim()
      ? [product.image]
      : [];

  const firstImage = images[0] || "";

  const finalPrice = Number(product.finalPrice);
  const basePrice = Number(product.basePrice);
  const discount = Number(product.discount);
  const averageRating = Number(product.averageRating);
  const totalReviews = Number(product.totalReviews);
  const totalStock = Number(product.totalStock);
  const totalSold = Number(product.totalSold);

  return {
    // -------------------------------------------------
    // ORIGINAL BACKEND DATA
    // -------------------------------------------------

    ...product,

    // -------------------------------------------------
    // ID / SLUG
    // -------------------------------------------------

    id: product._id ? String(product._id) : "",

    _id: product._id ? String(product._id) : "",

    slug:
      typeof product.slug === "string" && product.slug.trim()
        ? product.slug.trim()
        : "",

    // -------------------------------------------------
    // IMAGES
    // -------------------------------------------------

    images,

    image: firstImage,

    // -------------------------------------------------
    // PRICE
    // -------------------------------------------------

    finalPrice: Number.isFinite(finalPrice) ? finalPrice : 0,

    basePrice: Number.isFinite(basePrice) ? basePrice : 0,

    discount: Number.isFinite(discount) ? discount : 0,

    // Common frontend aliases
    price: Number.isFinite(finalPrice) ? finalPrice : 0,

    oldPrice: Number.isFinite(basePrice) ? basePrice : 0,

    // -------------------------------------------------
    // RATING
    // -------------------------------------------------

    averageRating: Number.isFinite(averageRating) ? averageRating : 0,

    totalReviews: Number.isFinite(totalReviews) ? totalReviews : 0,

    // Common frontend aliases
    rating: Number.isFinite(averageRating) ? averageRating : 0,

    ratingCount: Number.isFinite(totalReviews) ? totalReviews : 0,

    // -------------------------------------------------
    // STOCK / SALES
    // -------------------------------------------------

    totalStock: Number.isFinite(totalStock) ? totalStock : 0,

    totalSold: Number.isFinite(totalSold) ? totalSold : 0,

    stock: Number.isFinite(totalStock) ? totalStock : 0,

    soldCount: Number.isFinite(totalSold) ? totalSold : 0,

    // -------------------------------------------------
    // VARIANTS
    // -------------------------------------------------

    variants,

    // -------------------------------------------------
    // CATEGORY
    // -------------------------------------------------

    categoryName:
      category?.name ||
      (typeof product.category === "string" ? product.category : ""),

    categoryId:
      category?._id ||
      (typeof product.category === "string" ? product.category : ""),

    // -------------------------------------------------
    // BRAND
    // -------------------------------------------------

    brandName:
      brand?.name || (typeof product.brand === "string" ? product.brand : ""),

    brandId:
      brand?._id || (typeof product.brand === "string" ? product.brand : ""),
  };
};

// =====================================================
// FETCH PRODUCTS
// =====================================================

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",

  async (params = {}, { rejectWithValue }) => {
    try {
      const result = await getProductsApi(params);

      const rawProducts = Array.isArray(result?.products)
        ? result.products
        : [];

      const products = rawProducts.map(normalizeProduct).filter(Boolean);

      return {
        products,

        pagination: result?.pagination || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load products",
      );
    }
  },
);

// =====================================================
// FETCH PRODUCT BY SLUG
// =====================================================

export const fetchProductBySlug = createAsyncThunk(
  "products/fetchProductBySlug",

  async (slug, { rejectWithValue }) => {
    try {
      if (!slug?.trim()) {
        throw new Error("Product slug is required");
      }

      const product = await getProductBySlugApi(slug);

      const normalizedProduct = normalizeProduct(product);

      if (!normalizedProduct) {
        throw new Error("Product not found");
      }

      return normalizedProduct;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load product",
      );
    }
  },
);

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  items: [],

  currentProduct: null,

  pagination: {
    currentPage: 1,
    limit: 20,
    totalProducts: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  loading: false,

  currentLoading: false,

  error: null,

  currentError: null,
};

// =====================================================
// PRODUCT SLICE
// =====================================================

const productSlice = createSlice({
  name: "products",

  initialState,

  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.currentError = null;
      state.currentLoading = false;
    },

    clearProductError: (state) => {
      state.error = null;
      state.currentError = null;
    },
  },

  extraReducers: (builder) => {
    // =================================================
    // FETCH PRODUCTS
    // =================================================

    builder

      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.items = Array.isArray(action.payload?.products)
          ? action.payload.products
          : [];

        if (action.payload?.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to load products";
      })

      // =================================================
      // FETCH SINGLE PRODUCT
      // =================================================

      .addCase(fetchProductBySlug.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
        state.currentProduct = null;
      })

      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentError = null;

        state.currentProduct = action.payload || null;
      })

      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentProduct = null;

        state.currentError = action.payload || "Failed to load product";
      });
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const { clearCurrentProduct, clearProductError } = productSlice.actions;

// =====================================================
// SELECTORS
// =====================================================

export const selectProducts = (state) => state.products?.items || [];

export const selectCurrentProduct = (state) =>
  state.products?.currentProduct || null;

export const selectProductsLoading = (state) =>
  Boolean(state.products?.loading);

export const selectCurrentProductLoading = (state) =>
  Boolean(state.products?.currentLoading);

export const selectProductsError = (state) => state.products?.error || null;

export const selectCurrentProductError = (state) =>
  state.products?.currentError || null;

// =====================================================
// REDUCER
// =====================================================

export default productSlice.reducer;
